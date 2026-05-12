from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Volunteer
from pydantic import BaseModel
from typing import Optional
import hashlib

router = APIRouter()


def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


class VolunteerCreate(BaseModel):
    name: str
    pin: str


class VerifyPin(BaseModel):
    pin: str


class VolunteerResponse(BaseModel):
    id: int
    name: str
    has_pin: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=list[VolunteerResponse])
def get_volunteers(db: Session = Depends(get_db)):
    volunteers = db.query(Volunteer).all()
    return [{
        "id": v.id,
        "name": v.name,
        "has_pin": v.pin_hash is not None
    } for v in volunteers]


@router.post("/", response_model=VolunteerResponse)
def create_volunteer(volunteer: VolunteerCreate, db: Session = Depends(get_db)):
    if not volunteer.pin or len(volunteer.pin) != 4 or not volunteer.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")

    # Check PIN is unique
    pin_hash = hash_pin(volunteer.pin)
    existing = db.query(Volunteer).filter(Volunteer.pin_hash == pin_hash).first()
    if existing:
        raise HTTPException(status_code=400, detail="PIN already in use by another volunteer")

    new_vol = Volunteer(
        name=volunteer.name,
        pin_hash=pin_hash
    )
    db.add(new_vol)
    db.commit()
    db.refresh(new_vol)
    return {
        "id": new_vol.id,
        "name": new_vol.name,
        "has_pin": True
    }


@router.post("/verify-pin")
def verify_pin(data: VerifyPin, db: Session = Depends(get_db)):
    pin_hash = hash_pin(data.pin)
    vol = db.query(Volunteer).filter(Volunteer.pin_hash == pin_hash).first()
    if not vol:
        raise HTTPException(status_code=401, detail="PIN not recognized")
    return {"success": True, "name": vol.name, "id": vol.id}


@router.put("/{volunteer_id}/pin")
def update_pin(volunteer_id: int, data: VerifyPin, db: Session = Depends(get_db)):
    if not data.pin or len(data.pin) != 4 or not data.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")

    pin_hash = hash_pin(data.pin)
    existing = db.query(Volunteer).filter(
        Volunteer.pin_hash == pin_hash,
        Volunteer.id != volunteer_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="PIN already in use by another volunteer")

    vol = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    vol.pin_hash = pin_hash
    db.commit()
    return {"message": f"PIN updated for {vol.name}"}


@router.delete("/{volunteer_id}")
def delete_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    vol = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    db.delete(vol)
    db.commit()
    return {"message": f"{vol.name} removed"}
