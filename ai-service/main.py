"""
Damk 3alena - AI Service
FastAPI microservice with 3 endpoints: forecast, shortage detection, donor recommendations.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models.forecaster import BloodDemandForecaster
from models.shortage import detect_shortages
from models.recommender import recommend_donors

app = FastAPI(
    title="Damk 3alena AI Service",
    description="Blood demand forecasting, shortage detection, and donor recommendations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize forecaster
forecaster = BloodDemandForecaster()


@app.on_event("startup")
async def startup():
    """Load or train the forecasting model on startup."""
    if not forecaster.load():
        print("No pre-trained model found. Training from synthetic data...")
        metrics = forecaster.train()
        print(f"Model trained: {metrics}")


# ==========================================
# Request/Response Models
# ==========================================

class ForecastRequest(BaseModel):
    facility_idx: int
    blood_types: list[str]
    weeks_ahead: int = 4

class ForecastResponse(BaseModel):
    predictions: list[dict]

class ShortageRequest(BaseModel):
    forecasts: list[dict]
    current_inventory: dict[str, int]
    threshold_warning: int = 15
    threshold_critical: int = 5

class ShortageResponse(BaseModel):
    alerts: list[dict]

class DonorInfo(BaseModel):
    donor_id: str
    blood_type: str
    latitude: float
    longitude: float
    is_eligible: bool
    total_donations: int = 0
    last_donation: str | None = None

class RecommendRequest(BaseModel):
    request_blood_type: str
    facility_lat: float
    facility_lng: float
    donors: list[DonorInfo]
    top_n: int = 20

class RecommendResponse(BaseModel):
    recommendations: list[dict]


# ==========================================
# Endpoints
# ==========================================

@app.get("/")
async def root():
    return {"service": "Damk 3alena AI", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": forecaster.is_trained}


@app.post("/api/forecast", response_model=ForecastResponse)
async def forecast(req: ForecastRequest):
    """Predict blood demand for a facility over the next N weeks."""
    try:
        predictions = forecaster.predict(
            facility_idx=req.facility_idx,
            blood_types=req.blood_types,
            weeks_ahead=req.weeks_ahead,
        )
        return ForecastResponse(predictions=predictions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/shortage-detect", response_model=ShortageResponse)
async def shortage_detect(req: ShortageRequest):
    """Detect current and upcoming blood shortages."""
    alerts = detect_shortages(
        forecasts=req.forecasts,
        current_inventory=req.current_inventory,
        threshold_warning=req.threshold_warning,
        threshold_critical=req.threshold_critical,
    )
    return ShortageResponse(alerts=alerts)


@app.post("/api/recommend-donors", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    """Get ranked donor recommendations for a blood request."""
    donor_dicts = [d.model_dump() for d in req.donors]
    recommendations = recommend_donors(
        request_blood_type=req.request_blood_type,
        facility_lat=req.facility_lat,
        facility_lng=req.facility_lng,
        donors=donor_dicts,
        top_n=req.top_n,
    )
    return RecommendResponse(recommendations=recommendations)


@app.post("/api/train")
async def train_model():
    """Retrain the forecasting model (admin endpoint)."""
    try:
        metrics = forecaster.train()
        return {"status": "trained", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
