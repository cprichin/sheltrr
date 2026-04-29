from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Cage, Dog
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class CageCreate(BaseModel):
    cage_number: str
    nfc_tag_uid: str
    location: Optional[str] = "indoor"

class CageAssign(BaseModel):
    dog_id: Optional[int] = None  # None to unassign

class CageResponse(BaseModel):
    id: int
    cage_number: str
    nfc_tag_uid: str
    location: str
    current_dog_id: Optional[int]
    current_dog_name: Optional[str]

    class Config:
        from_attributes = True

@router.get("/", response_model=list[CageResponse])
def get_cages(db: Session = Depends(get_db)):
    cages = db.query(Cage).all()
    return [{
        "id": c.id,
        "cage_number": c.cage_number,
        "nfc_tag_uid": c.nfc_tag_uid,
        "location": c.location,
        "current_dog_id": c.current_dog_id,
        "current_dog_name": c.current_dog.name if c.current_dog else None
    } for c in cages]

@router.post("/", response_model=CageResponse)
def create_cage(cage: CageCreate, db: Session = Depends(get_db)):
    existing = db.query(Cage).filter(Cage.nfc_tag_uid == cage.nfc_tag_uid).first()
    if existing:
        raise HTTPException(status_code=400, detail="NFC tag already registered to a cage")
    new_cage = Cage(**cage.model_dump())
    db.add(new_cage)
    db.commit()
    db.refresh(new_cage)
    return {
        "id": new_cage.id,
        "cage_number": new_cage.cage_number,
        "nfc_tag_uid": new_cage.nfc_tag_uid,
        "location": new_cage.location,
        "current_dog_id": None,
        "current_dog_name": None
    }

@router.put("/{cage_id}/assign")
def assign_dog(cage_id: int, assignment: CageAssign, db: Session = Depends(get_db)):
    cage = db.query(Cage).filter(Cage.id == cage_id).first()
    if not cage:
        raise HTTPException(status_code=404, detail="Cage not found")

    if assignment.dog_id:
        dog = db.query(Dog).filter(Dog.id == assignment.dog_id).first()
        if not dog:
            raise HTTPException(status_code=404, detail="Dog not found")
        # Unassign this dog from any other cage first
        other_cage = db.query(Cage).filter(
            Cage.current_dog_id == assignment.dog_id,
            Cage.id != cage_id
        ).first()
        if other_cage:
            other_cage.current_dog_id = None
        cage.current_dog_id = assignment.dog_id
        msg = f"{dog.name} assigned to cage {cage.cage_number}"
    else:
        cage.current_dog_id = None
        msg = f"Cage {cage.cage_number} unassigned"

    db.commit()
    return {"message": msg}

@router.delete("/{cage_id}")
def delete_cage(cage_id: int, db: Session = Depends(get_db)):
    cage = db.query(Cage).filter(Cage.id == cage_id).first()
    if not cage:
        raise HTTPException(status_code=404, detail="Cage not found")
    db.delete(cage)
    db.commit()
    return {"message": f"Cage {cage.cage_number} removed"}