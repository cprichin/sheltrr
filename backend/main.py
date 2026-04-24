from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import walks, dogs, volunteers

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PawTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(dogs.router, prefix="/api/dogs", tags=["Dogs"])
app.include_router(volunteers.router, prefix="/api/volunteers", tags=["Volunteers"])
app.include_router(walks.router, prefix="/api/walks", tags=["Walks"])

@app.get("/")
def root():
    return {"status": "PawTrack API is running"}
