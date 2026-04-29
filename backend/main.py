from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import walks, dogs, volunteers, cages

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sheltrr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(dogs.router, prefix="/api/dogs", tags=["Dogs"])
app.include_router(volunteers.router, prefix="/api/volunteers", tags=["Volunteers"])
app.include_router(walks.router, prefix="/api/walks", tags=["Walks"])
app.include_router(cages.router, prefix="/api/cages", tags=["Cages"])

@app.get("/")
def root():
    return {"status": "Sheltrr API is running"}
