import os
import shutil
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.report import Report
from app.models.user import User
from app.services.report import extract_text_from_pdf


router = APIRouter(prefix="/reports", tags=["Reports"])

UPLOAD_DIR = "uploads/reports"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed.",
        )

    file_extension = os.path.splitext(file.filename or "")[1].lower()

    if file_extension != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed.",
        )

    unique_filename = f"{uuid4()}.pdf"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extracted_text = extract_text_from_pdf(file_path)

        if not extracted_text:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from this PDF.",
            )

        report = Report(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            extracted_text=extracted_text,
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

    except HTTPException:
        raise

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process report: {str(e)}",
        )

    finally:
        file.file.close() 

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
    }
