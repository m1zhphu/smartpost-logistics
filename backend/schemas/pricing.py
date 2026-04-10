from pydantic import BaseModel, Field
from typing import Optional, List

class FeeCalculateRequest(BaseModel):
    origin_hub_id: int
    dest_hub_id: int
    weight: float
    service_type: str = "STANDARD"
    extra_services: Optional[List[str]] = []
    cod_amount: Optional[float] = 0.0

class HubNested(BaseModel):
    hub_id: int
    hub_code: str
    hub_name: str

    class Config:
        from_attributes = True

class PricingRuleCreate(BaseModel):
    origin_hub_id: int
    dest_hub_id: int
    service_type: str = "STANDARD"
    min_weight: float = 0
    max_weight: float
    price: float = Field(gt=0)
    policy_id: int = 1
    is_active: bool = True

class PricingRuleResponse(PricingRuleCreate):
    rule_id: int
    origin_hub: Optional[HubNested] = None
    dest_hub: Optional[HubNested] = None

    class Config:
        from_attributes = True

class ServiceConfigBase(BaseModel):
    service_code: str
    service_name: str
    fee_type: str = "FIXED"
    fee_value: float
    is_active: bool = True

class ServiceConfigCreate(ServiceConfigBase):
    pass

class ServiceConfigResponse(ServiceConfigBase):
    id: int

    class Config:
        from_attributes = True