import json
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.report import Report
from app.models.user import User
from app.api.auth import get_current_user
from app.services.report import extract_text_from_pdf
from app.services.parameter_extractor import extract_parameters


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


UPLOAD_DIR = "uploads/reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    # Create a unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save uploaded PDF
    try:
        contents = await file.read()

        with open(file_path, "wb") as buffer:
            buffer.write(contents)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save the uploaded file: {str(e)}",
        )

    # Extract text from PDF
    extracted_text = extract_text_from_pdf(file_path)

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from this PDF.",
        )

    # Extract blood parameters
    extracted_parameters = extract_parameters(extracted_text)

    # Create database record
    report = Report(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        extracted_parameters=json.dumps(extracted_parameters),
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "filename": report.filename,
        "uploaded_at": report.uploaded_at,
        "message": "Report uploaded and text extracted successfully.",
    }


@router.get("/")
def get_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.uploaded_at.desc())
        .all()
    )

    return [
        {
            "id": report.id,
            "filename": report.filename,
            "uploaded_at": report.uploaded_at,
        }
        for report in reports
    ]


@router.get("/{report_id}")
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
            Report.user_id == current_user.id,
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    return {
        "id": report.id,
        "filename": report.filename,
        "uploaded_at": report.uploaded_at,
        "extracted_text": report.extracted_text,
        "extracted_parameters": (
            json.loads(report.extracted_parameters)
            if report.extracted_parameters
            else {}
        ),
    } 