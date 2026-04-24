from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Dog(Base):
    __tablename__ = "dogs"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    breed = Column(String(100))
    cage_number = Column(String(20))
    nfc_tag_uid = Column(String(100), unique=True, nullable=False)
    location = Column(String(20))
    walks = relationship("Walk", back_populates="dog")

class Volunteer(Base):
    __tablename__ = "volunteers"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    nfc_fob_uid = Column(String(100), unique=True, nullable=False)
    walks = relationship("Walk", back_populates="volunteer")

class Walk(Base):
    __tablename__ = "walks"
    id = Column(Integer, primary_key=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(String(20), default="active")
    dog = relationship("Dog", back_populates="walks")
    volunteer = relationship("Volunteer", back_populates="walks")
