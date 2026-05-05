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
    location_id: int


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
    from models import Cage, Location

    volunteer = db.query(Volunteer).filter(
        Volunteer.nfc_fob_uid == event.fob_uid
    ).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer fob not recognized")

    cage = db.query(Cage).filter(Cage.nfc_tag_uid == event.tag_uid).first()
    if not cage:
        raise HTTPException(status_code=404, detail="Cage tag not recognized")

    if not cage.current_dog_id:
        raise HTTPException(status_code=404, detail=f"No dog assigned to cage {cage.cage_number}")

    location = db.query(Location).filter(Location.id == event.location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    dog = cage.current_dog

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
            "cage": cage.cage_number,
            "location": location.name,
            "duration_minutes": active_walk.duration_minutes
        }
    else:
        walk = Walk(
            dog_id=dog.id,
            volunteer_id=volunteer.id,
            cage_id=cage.id,
            location_id=event.location_id,
            start_time=datetime.now(),
            status="active"
        )
        db.add(walk)
        db.commit()
        return {
            "action": "checked_out",
            "dog": dog.name,
            "volunteer": volunteer.name,
            "cage": cage.cage_number,
            "location": location.name
        }


@router.get("/active")
def get_active_walks(db: Session = Depends(get_db)):
    walks = db.query(Walk).filter(Walk.status == "active").all()
    return [{
        "id": w.id,
        "dog_name": w.dog.name,
        "volunteer_name": w.volunteer.name,
        "start_time": w.start_time,
        "location": w.location.name if w.location else "—"
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
        "duration_minutes": w.duration_minutes,
        "location": w.location.name if w.location else "—"
    } for w in walks]


@router.get("/status")
def get_dog_status(db: Session = Depends(get_db)):
    from models import Cage
    cages = db.query(Cage).all()
    result = []

    for cage in cages:
        if not cage.current_dog_id:
            result.append({
                "id": None,
                "name": "Empty",
                "breed": None,
                "cage_number": cage.cage_number,
                "location": cage.location,
                "status": "empty",
                "volunteer_name": None,
                "start_time": None,
                "duration_minutes": None,
                "walk_location": None
            })
            continue

        dog = cage.current_dog

        active = db.query(Walk).filter(
            Walk.dog_id == dog.id,
            Walk.status == "active"
        ).first()

        if active:
            result.append({
                "id": dog.id,
                "name": dog.name,
                "breed": dog.breed,
                "cage_number": cage.cage_number,
                "location": cage.location,
                "status": "out",
                "volunteer_name": active.volunteer.name,
                "start_time": active.start_time,
                "duration_minutes": int((datetime.now() - active.start_time).seconds / 60),
                "walk_location": active.location.name if active.location else None
            })
            continue

        today_walk = db.query(Walk).filter(
            Walk.dog_id == dog.id,
            Walk.status == "completed",
            Walk.start_time >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        ).first()

        if today_walk:
            result.append({
                "id": dog.id,
                "name": dog.name,
                "breed": dog.breed,
                "cage_number": cage.cage_number,
                "location": cage.location,
                "status": "walked",
                "volunteer_name": today_walk.volunteer.name,
                "start_time": today_walk.start_time,
                "duration_minutes": today_walk.duration_minutes,
                "walk_location": None
            })
        else:
            result.append({
                "id": dog.id,
                "name": dog.name,
                "breed": dog.breed,
                "cage_number": cage.cage_number,
                "location": cage.location,
                "status": "not_walked",
                "volunteer_name": None,
                "start_time": None,
                "duration_minutes": None,
                "walk_location": None
            })

    return result


@router.get("/summary")
def get_daily_summary(
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from models import Cage
    if date:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    else:
        target_date = datetime.now().date()

    start = datetime.combine(target_date, datetime.min.time())
    end = datetime.combine(target_date, datetime.max.time())

    cages = db.query(Cage).all()
    summary = []

    for cage in cages:
        if not cage.current_dog_id:
            continue

        dog = cage.current_dog
        walks = db.query(Walk).filter(
            Walk.dog_id == dog.id,
            Walk.status == "completed",
            Walk.start_time >= start,
            Walk.start_time <= end
        ).all()

        summary.append({
            "dog_id": dog.id,
            "dog_name": dog.name,
            "breed": dog.breed,
            "cage_number": cage.cage_number,
            "location": cage.location,
            "walk_count": len(walks),
            "total_minutes": sum(w.duration_minutes or 0 for w in walks),
            "volunteers": list(set(w.volunteer.name for w in walks)),
            "walked": len(walks) > 0
        })

    total_dogs = len(summary)
    walked_today = sum(1 for d in summary if d["walked"])

    return {
        "date": target_date.isoformat(),
        "total_dogs": total_dogs,
        "walked_today": walked_today,
        "not_walked_today": total_dogs - walked_today,
        "dogs": sorted(summary, key=lambda x: (not x["walked"], x["dog_name"]))
    }
