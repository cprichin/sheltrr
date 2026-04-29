from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Dog
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DogCreate(BaseModel):
    name: str
    breed: Optional[str] = None

class DogResponse(BaseModel):
    id: int
    name: str
    breed: Optional[str]

    class Config:
        from_attributes = True

@router.get("/", response_model=list[DogResponse])
def get_dogs(db: Session = Depends(get_db)):
    return db.query(Dog).all()

@router.post("/", response_model=DogResponse)
def create_dog(dog: DogCreate, db: Session = Depends(get_db)):
    new_dog = Dog(**dog.model_dump())
    db.add(new_dog)
    db.commit()
    db.refresh(new_dog)
    return new_dog

@router.delete("/{dog_id}")
def delete_dog(dog_id: int, db: Session = Depends(get_db)):
    dog = db.query(Dog).filter(Dog.id == dog_id).first()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    db.delete(dog)
    db.commit()
    return {"message": f"{dog.name} removed"}