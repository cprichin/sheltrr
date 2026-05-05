from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import Location
from routers import walks, dogs, volunteers, cages, admin, locations

Base.metadata.create_all(bind=engine)

# Seed default location
def seed_defaults():
    db = SessionLocal()
    try:
        if not db.query(Location).first():
            db.add(Location(name="Outdoor"))
            db.commit()
    finally:
        db.close()

seed_defaults()

app = FastAPI(title="Sheltrr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(dogs.router, prefix="/api/dogs", tags=["Dogs"])
app.include_router(volunteers.router, prefix="/api/volunteers", tags=["Volunteers"])
app.include_router(walks.router, prefix="/api/walks", tags=["Walks"])
app.include_router(cages.router, prefix="/api/cages", tags=["Cages"])
app.include_router(locations.router, prefix="/api/locations", tags=["Locations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def root():
    return {"status": "Sheltrr API is running"}