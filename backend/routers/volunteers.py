from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Volunteer
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class VolunteerCreate(BaseModel):
    name: str
    nfc_fob_uid: str

class VolunteerResponse(BaseModel):
    id: int
    name: str
    nfc_fob_uid: str

    class Config:
        from_attributes = True

@router.get("/", response_model=list[VolunteerResponse])
def get_volunteers(db: Session = Depends(get_db)):
    return db.query(Volunteer).all()

@router.post("/", response_model=VolunteerResponse)
def create_volunteer(volunteer: VolunteerCreate, db: Session = Depends(get_db)):
    existing = db.query(Volunteer).filter(
        Volunteer.nfc_fob_uid == volunteer.nfc_fob_uid
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fob UID already registered")
    new_volunteer = Volunteer(**volunteer.model_dump())
    db.add(new_volunteer)
    db.commit()
    db.refresh(new_volunteer)
    return new_volunteer

@router.delete("/{volunteer_id}")
def delete_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    db.delete(volunteer)
    db.commit()
    return {"message": f"{volunteer.name} removed"}

