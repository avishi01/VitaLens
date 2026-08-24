from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.reports import router as reports_router
from app.db.database import Base, engine
from app.models import Report, User


Base.metadata.create_all(bind=engine)


app = FastAPI(title="VitaLens API")


@app.get("/")
def root():
    return {"message": "VitaLens API is running"}


app.include_router(auth_router)
app.include_router(reports_router) 