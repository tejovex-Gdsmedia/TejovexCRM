from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os

app = FastAPI(title="TejovexCRM ML Service", version="1.0.0")

# ── Load Models on Startup ─────────────────────────────
print("Loading models...")

deal_model = joblib.load('models/deal_win_model.pkl')
stage_encoder = joblib.load('models/stage_encoder.pkl')
deal_features = joblib.load('models/deal_features.pkl')

lead_model = joblib.load('models/lead_conversion_model.pkl')
source_encoder = joblib.load('models/source_encoder.pkl')
lead_features = joblib.load('models/lead_features.pkl')

rev_model = joblib.load('models/revenue_forecast_model.pkl')
last_month_num = joblib.load('models/last_month_num.pkl')

print("✅ All models loaded successfully")

# ── Request Models ─────────────────────────────────────
class DealPredictRequest(BaseModel):
    id: str
    title: str
    value: float
    probability: int
    stage: str
    follow_up_count: int = 0
    days_in_stage: int = 0
    has_note: int = 0
    has_task: int = 0
    assigned: int = 0

class LeadPredictRequest(BaseModel):
    id: str
    title: str
    value: float
    source: str
    follow_up_count: int = 0
    days_since_created: int = 0
    assigned: int = 0

# ── Helper: Score to Label ─────────────────────────────
def score_to_label(score: float) -> str:
    if score >= 70:
        return "High"
    elif score >= 40:
        return "Medium"
    else:
        return "Low"

def score_to_risk_label(score: float) -> str:
    if score >= 70:
        return "High Risk"
    elif score >= 40:
        return "Medium Risk"
    else:
        return "Low Risk"

# ── Routes ─────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "TejovexCRM ML Service",
        "status": "running",
        "endpoints": [
            "POST /predict/deal",
            "POST /predict/lead",
            "GET  /predict/revenue"
        ]
    }

@app.get("/health")
def health():
    return { "status": "ok", "timestamp": datetime.now().isoformat() }

# ── ENDPOINT 1: Deal Win Probability ───────────────────
@app.post("/predict/deal")
def predict_deal(req: DealPredictRequest):
    try:
        # Encode stage
        known_stages = list(stage_encoder.classes_)
        stage = req.stage if req.stage in known_stages else known_stages[0]
        stage_encoded = stage_encoder.transform([stage])[0]

        # Build input
        input_data = pd.DataFrame([{
            'value': req.value,
            'probability': req.probability,
            'stage_encoded': stage_encoded,
            'follow_up_count': req.follow_up_count,
            'days_in_stage': req.days_in_stage,
            'has_note': req.has_note,
            'has_task': req.has_task,
            'assigned': req.assigned
        }])[deal_features]

        # Predict
        prob = deal_model.predict_proba(input_data)[0][1]
        score = round(prob * 100, 1)
        label = score_to_label(score)

        # Reasoning
        reasons = []
        if req.stage in ['Negotiation', 'Proposal']:
            reasons.append(f"deal is at {req.stage} stage")
        if req.follow_up_count > 5:
            reasons.append(f"strong follow-up activity ({req.follow_up_count} follow-ups)")
        if req.days_in_stage > 30:
            reasons.append(f"stalled for {req.days_in_stage} days — action needed")
        if req.value > 100000:
            reasons.append(f"high value deal (₹{req.value:,.0f})")
        if req.probability > 60:
            reasons.append(f"manual probability set at {req.probability}%")

        reasoning = f"Win probability is {label.lower()} because " + (
            ", ".join(reasons) if reasons else "based on current deal data"
        ) + "."

        return {
            "entityType": "DEAL",
            "entityId": req.id,
            "type": "WIN_PROBABILITY",
            "score": score,
            "label": label,
            "reasoning": reasoning,
            "title": req.title,
            "generatedAt": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ENDPOINT 2: Lead Conversion Score ─────────────────
@app.post("/predict/lead")
def predict_lead(req: LeadPredictRequest):
    try:
        # Encode source
        known_sources = list(source_encoder.classes_)
        source = req.source if req.source in known_sources else known_sources[0]
        source_encoded = source_encoder.transform([source])[0]

        # Build input
        input_data = pd.DataFrame([{
            'value': req.value,
            'source_encoded': source_encoded,
            'follow_up_count': req.follow_up_count,
            'days_since_created': req.days_since_created,
            'assigned': req.assigned
        }])[lead_features]

        # Predict
        prob = lead_model.predict_proba(input_data)[0][1]
        score = round(prob * 100, 1)
        label = score_to_label(score)

        # Reasoning
        reasons = []
        if req.source == 'REFERRAL':
            reasons.append("lead came from referral (high trust source)")
        elif req.source == 'INDIAMART':
            reasons.append("lead from IndiaMart (commercial intent)")
        if req.follow_up_count > 4:
            reasons.append(f"{req.follow_up_count} follow-ups completed")
        if req.days_since_created < 30:
            reasons.append("recent lead with active engagement")
        elif req.days_since_created > 90:
            reasons.append(f"lead is {req.days_since_created} days old — may need re-engagement")
        if req.value > 50000:
            reasons.append(f"high potential value (₹{req.value:,.0f})")

        reasoning = f"Conversion probability is {label.lower()} because " + (
            ", ".join(reasons) if reasons else "based on current lead data"
        ) + "."

        return {
            "entityType": "LEAD",
            "entityId": req.id,
            "type": "CONVERSION_SCORE",
            "score": score,
            "label": label,
            "reasoning": reasoning,
            "title": req.title,
            "generatedAt": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ENDPOINT 3: Revenue Forecast ───────────────────────
@app.get("/predict/revenue")
def predict_revenue():
    try:
        now = datetime.now()
        forecasts = []

        for i in range(1, 7):
            future_month_num = last_month_num + i
            predicted = rev_model.predict([[future_month_num]])[0]
            predicted = max(0, round(predicted, 2))

            # Calculate month label
            month_offset = now.month + i
            year_offset = now.year + (month_offset - 1) // 12
            month_label = ((month_offset - 1) % 12) + 1
            month_name = datetime(year_offset, month_label, 1).strftime('%b %Y')

            forecasts.append({
                "month": month_name,
                "predicted_revenue": predicted,
                "formatted": f"₹{predicted:,.0f}"
            })

        total = sum(f['predicted_revenue'] for f in forecasts)

        return {
            "type": "REVENUE_FORECAST",
            "period": "Next 6 months",
            "forecasts": forecasts,
            "total_forecast": round(total, 2),
            "total_formatted": f"₹{total:,.0f}",
            "generatedAt": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))