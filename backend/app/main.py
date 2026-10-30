from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import dataset, mining, hadoop

app = FastAPI(
    title="Market Basket Analysis & Apriori API",
    description="Interactive backend for Hadoop MapReduce Market Basket Analysis and Rule Mining",
    version="1.0.0"
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router)
app.include_router(mining.router)
app.include_router(hadoop.router)


@app.get("/")
def root():
    return {
        "message": "Market Basket Analysis API is running",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

