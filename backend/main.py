"""
SafeSense AI — FastAPI Backend
Provides REST API endpoints for safety report analysis, risk scoring,
pattern detection, and safety intelligence.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import io
import json
import re
from datetime import datetime

from services.risk_engine import analyze_report, calculate_risk_score, compute_patterns, compute_site_risk
from services.auth import create_access_token, verify_token
from services.report_generator import generate_summary_report

app = FastAPI(
    title="SafeSense AI API",
    description="AI-powered industrial safety intelligence platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ─── In-memory storage (replace with PostgreSQL in production) ────────────────
_datasets: Dict[str, Any] = {}
_actions: List[Dict] = []
_reviews: List[Dict] = []

# ─── Auth ─────────────────────────────────────────────────────────────────────
DEMO_USERS = {
    "admin@safesense.ai": {"password": "admin123", "role": "Administrator", "name": "Sam Rivera"},
    "hse@safesense.ai": {"password": "hse123", "role": "HSE Officer", "name": "Alex Morgan"},
    "manager@safesense.ai": {"password": "mgr123", "role": "Safety Manager", "name": "Jordan Lee"},
    "site@safesense.ai": {"password": "site123", "role": "Site Manager", "name": "Chris Patel"},
}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = DEMO_USERS.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"email": req.email, "role": user["role"]})
    return {"token": token, "user": {"email": req.email, "name": user["name"], "role": user["role"]}}

# ─── Upload ───────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    rows = df.fillna("").to_dict(orient="records")
    columns = list(df.columns)
    dataset_id = f"ds_{int(datetime.now().timestamp())}"
    _datasets[dataset_id] = {"rows": rows, "columns": columns, "filename": file.filename}

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "rows": len(rows),
        "columns": columns,
        "preview": rows[:10],
    }

# ─── Analyze single report ────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    report_text: str
    activity: Optional[str] = None
    severity: Optional[str] = None
    report_type: Optional[str] = None
    life_saving_rule: Optional[str] = None
    barrier_failure: Optional[str] = None

@app.post("/api/analyze-report")
async def analyze_single_report(req: AnalyzeRequest):
    result = analyze_report(req.dict())
    return result

# ─── Dashboard ────────────────────────────────────────────────────────────────
@app.get("/api/dashboard")
async def get_dashboard():
    return {"message": "Dashboard data computed client-side from uploaded dataset."}

# ─── Patterns ─────────────────────────────────────────────────────────────────
class PatternRequest(BaseModel):
    reports: List[Dict[str, Any]]

@app.post("/api/patterns")
async def get_patterns(req: PatternRequest):
    patterns = compute_patterns(req.reports)
    return {"patterns": patterns}

# ─── Site risk ────────────────────────────────────────────────────────────────
@app.post("/api/sites")
async def get_site_risk(req: PatternRequest):
    sites = compute_site_risk(req.reports)
    return {"sites": sites}

# ─── Actions ─────────────────────────────────────────────────────────────────
class ActionRequest(BaseModel):
    action: str
    owner: str
    priority: str
    due_date: str
    status: str = "Open"
    report_id: Optional[str] = None

@app.post("/api/actions")
async def create_action(req: ActionRequest):
    action = req.dict()
    action["id"] = f"ACT-{int(datetime.now().timestamp())}"
    action["created_at"] = datetime.now().isoformat()
    _actions.append(action)
    return action

@app.get("/api/actions")
async def get_actions():
    return {"actions": _actions}

# ─── Review ───────────────────────────────────────────────────────────────────
class ReviewRequest(BaseModel):
    report_id: str
    decision: str
    comment: Optional[str] = None
    reviewer: Optional[str] = None

@app.post("/api/review")
async def submit_review(req: ReviewRequest):
    review = req.dict()
    review["timestamp"] = datetime.now().isoformat()
    _reviews.append(review)
    return {"status": "recorded", "review": review}

# ─── Copilot ─────────────────────────────────────────────────────────────────
class CopilotRequest(BaseModel):
    query: str
    reports: Optional[List[Dict[str, Any]]] = None

@app.post("/api/copilot/query")
async def copilot_query(req: CopilotRequest):
    # Simple keyword-based backend response; frontend handles full logic client-side
    return {
        "response": "Query processed. For full AI responses, use the frontend SafeSense Copilot which analyzes your loaded dataset directly.",
        "source_reports": [],
    }

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "SafeSense AI API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
