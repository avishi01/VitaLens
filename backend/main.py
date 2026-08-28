from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.reports import router as reports_router
from app.api.ai import router as ai_router
from app.core.config import settings
from app.db.database import Base, engine
from app.models import Report, User


Base.metadata.create_all(bind=engine)


app = FastAPI(title="VitaLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "VitaLens API is running"}


app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(ai_router) 