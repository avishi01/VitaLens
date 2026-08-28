from pydantic import BaseModel


class AIExplanationResponse(BaseModel):
    report_id: int
    explanation: str


class AIDoctorQuestionsResponse(BaseModel):
    report_id: int
    questions: str


class AIComparisonSummaryResponse(BaseModel):
    older_report_id: int
    newer_report_id: int
    summary: str
