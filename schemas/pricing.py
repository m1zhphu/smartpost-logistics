from pydantic import BaseModel, Field

class PricingRuleCreate(BaseModel):
    from_province_id: int
    to_province_id: int
    service_type: str = "STANDARD"
    min_weight: float = 0
    max_weight: float
    price: float = Field(gt=0)

class PricingRuleResponse(PricingRuleCreate):
    rule_id: int # ID được sinh tự động từ Database

    class Config:
        from_attributes = True