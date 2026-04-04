FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate data and train model at build time
RUN python data/generate_synthetic.py && \
    python -c "from models.forecaster import BloodDemandForecaster; BloodDemandForecaster().train()"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
