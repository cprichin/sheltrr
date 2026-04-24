from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Walk, Dog, Volunteer
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class ScanEvent(BaseModel):
    fob_uid: str
    tag_uid: str

class WalkResponse(BaseModel):
    id: int
    dog_name: str
    volunteer_name: str
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    status: str

@router.post("/scan")
def handle_scan(event: ScanEvent, db: Session = Depends(get_db)):
    volunteer = db.query(Volunteer).filter(
        Volunteer.nfc_fob_uid == event.fob_uid
    ).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer fob not recognized")

    dog = db.query(Dog).filter(Dog.nfc_tag_uid == event.tag_uid).first()
    if not dog:
        raise HTTPException(status_code=404, detail="Cage tag not recognized")

    active_walk = db.query(Walk).filter(
        Walk.dog_id == dog.id,
        Walk.status == "active"
    ).first()

    if active_walk:
        active_walk.end_time = datetime.now()
        active_walk.duration_minutes = int(
            (active_walk.end_time - active_walk.start_time).seconds / 60
        )
        active_walk.status = "completed"
        db.commit()
        return {
            "action": "checked_in",
            "dog": dog.name,
            "volunteer": volunteer.name,
            "duration_minutes": active_walk.duration_minutes
        }
    else:
        walk = Walk(
            dog_id=dog.id,
            volunteer_id=volunteer.id,
            start_time=datetime.now(),
            status="active"
        )
        db.add(walk)
        db.commit()
        return {
            "action": "checked_out",
            "dog": dog.name,
            "volunteer": volunteer.name
        }

@router.get("/active")
def get_active_walks(db: Session = Depends(get_db)):
    walks = db.query(Walk).filter(Walk.status == "active").all()
    return [{
        "id": w.id,
        "dog_name": w.dog.name,
        "volunteer_name": w.volunteer.name,
        "start_time": w.start_time
    } for w in walks]

@router.get("/history")
def get_walk_history(
    dog_id: Optional[int] = None,
    volunteer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Walk).filter(Walk.status == "completed")
    if dog_id:
        query = query.filter(Walk.dog_id == dog_id)
    if volunteer_id:
        query = query.filter(Walk.volunteer_id == volunteer_id)
    walks = query.order_by(Walk.start_time.desc()).all()
    return [{
        "id": w.id,
        "dog_name": w.dog.name,
        "volunteer_name": w.volunteer.name,
        "start_time": w.start_time,
        "end_time": w.end_time,
        "duration_minutes": w.duration_minutes
    } for w in walks]
