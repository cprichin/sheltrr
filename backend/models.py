from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    walks = relationship("Walk", back_populates="location")


class Cage(Base):
    __tablename__ = "cages"
    id = Column(Integer, primary_key=True)
    cage_number = Column(String(20), nullable=False)
    nfc_tag_uid = Column(String(100), unique=True, nullable=False)
    location = Column(String(20), default="indoor")
    current_dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=True)
    current_dog = relationship("Dog", foreign_keys=[current_dog_id])
    walks = relationship("Walk", back_populates="cage")


class Dog(Base):
    __tablename__ = "dogs"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    breed = Column(String(100), nullable=True)
    active = Column(Boolean, default=True)
    walks = relationship("Walk", back_populates="dog")


class Volunteer(Base):
    __tablename__ = "volunteers"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    pin_hash = Column(String(64), nullable=True)
    walks = relationship("Walk", back_populates="volunteer")


class Walk(Base):
    __tablename__ = "walks"
    id = Column(Integer, primary_key=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=False)
    cage_id = Column(Integer, ForeignKey("cages.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(String(20), default="active")
    dog = relationship("Dog", back_populates="walks")
    volunteer = relationship("Volunteer", back_populates="walks")
    cage = relationship("Cage", back_populates="walks")
    location = relationship("Location", back_populates="walks")
