from fastapi import FastAPI

from app.api.auth import router as auth_router


app = FastAPI(title="VitaLens API")


@app.get("/")
def root():
    return {"message": "VitaLens API is running"}


app.include_router(auth_router)