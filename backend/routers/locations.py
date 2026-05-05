from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Location
from pydantic import BaseModel

router = APIRouter()

class LocationCreate(BaseModel):
    name: str

@router.get("/")
def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()

@router.post("/")
def create_location(loc: LocationCreate, db: Session = Depends(get_db)):
    existing = db.query(Location).filter(Location.name == loc.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location already exists")
    new_loc = Location(name=loc.name)
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc

@router.delete("/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return {"message": f"{loc.name} removed"}