import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.report import Report
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.ai import (
    AIExplanationResponse,
    AIDoctorQuestionsResponse,
    AIComparisonSummaryResponse,
)
from app.services.ai_service import (
    explain_report,
    generate_doctor_questions,
    generate_comparison_summary,
    AIServiceUnavailableError,
    AIServiceTimeoutError,
    AIServiceModelError,
)


router = APIRouter(prefix="/ai", tags=["AI"])


def _get_owned_report(report_id: int, current_user: User, db: Session) -> Report:
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
            Report.user_id == current_user.id,
        )
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    return report


def _parsed_parameters(report: Report) -> dict:
    return json.loads(report.extracted_parameters) if report.extracted_parameters else {}


def _run_ai(callable_fn, *args):
    """Runs an ai_service call and maps its exceptions onto HTTP responses."""
    try:
        return callable_fn(*args)
    except AIServiceUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except AIServiceTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e)) from e
    except AIServiceModelError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@router.post("/reports/{report_id}/explain", response_model=AIExplanationResponse)
def explain(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_owned_report(report_id, current_user, db)
    parameters = _parsed_parameters(report)

    explanation = _run_ai(explain_report, parameters)

    return {"report_id": report.id, "explanation": explanation}


@router.post("/reports/{report_id}/questions", response_model=AIDoctorQuestionsResponse)
def doctor_questions(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_owned_report(report_id, current_user, db)
    parameters = _parsed_parameters(report)

    questions = _run_ai(generate_doctor_questions, parameters)

    return {"report_id": report.id, "questions": questions}


@router.post(
    "/compare/{report_id_a}/{report_id_b}/summary",
    response_model=AIComparisonSummaryResponse,
)
def comparison_summary(
    report_id_a: int,
    report_id_b: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report_a = _get_owned_report(report_id_a, current_user, db)
    report_b = _get_owned_report(report_id_b, current_user, db)

    # Always compare chronologically regardless of the order the two IDs
    # were passed in, matching the existing frontend comparison behavior.
    older, newer = (
        (report_a, report_b)
        if report_a.uploaded_at <= report_b.uploaded_at
        else (report_b, report_a)
    )

    summary = _run_ai(
        generate_comparison_summary,
        _parsed_parameters(older),
        _parsed_parameters(newer),
        str(older.uploaded_at),
        str(newer.uploaded_at),
    )

    return {
        "older_report_id": older.id,
        "newer_report_id": newer.id,
        "summary": summary,
    }
