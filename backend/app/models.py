from typing import List, Optional
from pydantic import BaseModel, Field


class ItemAddRequest(BaseModel):
    item: str = Field(..., min_length=1, description="Item name to insert")


class DatasetGenerateRequest(BaseModel):
    rows: int = Field(100, ge=1, le=100000, description="Number of transactions to generate")


class DatasetInfo(BaseModel):
    dataset_name: str
    total_transactions: int
    unique_items_count: int
    sample_transactions: List[List[str]]
    unique_items: List[str]


class MiningParams(BaseModel):
    dataset_name: Optional[str] = "csv_dataset_sample.csv"
    min_support: int = Field(250, ge=1, description="Minimum transaction support count")
    min_confidence: float = Field(0.5, ge=0.0, le=1.0, description="Minimum confidence threshold (0.0 to 1.0)")
    max_itemset_length: int = Field(10, ge=1, le=20, description="Maximum itemset length to evaluate")


class PassMetric(BaseModel):
    pass_number: int
    frequent_count: int
    discarded_count: int
    duration_seconds: float


class FrequentItemset(BaseModel):
    itemset: List[str]
    support: int
    support_pct: float
    length: int


class AssociationRule(BaseModel):
    antecedent: List[str]
    consequent: List[str]
    support_count: int
    support_pct: float
    confidence: float
    lift: float


class MiningJobStatus(BaseModel):
    job_id: str
    status: str  # "pending", "running", "completed", "failed"
    current_pass: int
    total_transactions: int
    pass_metrics: List[PassMetric] = []
    frequent_itemsets: List[FrequentItemset] = []
    rules: List[AssociationRule] = []
    error: Optional[str] = None

