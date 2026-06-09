from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class FeeCalculateRequest(BaseModel):
    origin_hub_id: int
    dest_hub_id: int
    weight: float
    length: Optional[float] = 0.0
    width: Optional[float] = 0.0
    height: Optional[float] = 0.0
    service_type: str = "STANDARD"
    extra_services: Optional[List[str]] = []
    cod_amount: Optional[float] = 0.0
    declared_value: Optional[float] = 0.0
    quantity: Optional[int] = 1
    packing_type: Optional[str] = None
    customer_id: Optional[int] = None
    dest_district_id: Optional[int] = None
    dest_ward_id: Optional[int] = None

class PricingSimulatorRequest(BaseModel):
    origin_province_id: int
    dest_province_id: int
    weight: float
    length: Optional[float] = 0.0
    width: Optional[float] = 0.0
    height: Optional[float] = 0.0
    service_type: str = "STANDARD"
    extra_services: Optional[List[str]] = []
    cod_amount: Optional[float] = 0.0
    declared_value: Optional[float] = 0.0
    quantity: Optional[int] = 1
    packing_type: Optional[str] = None

class HubNested(BaseModel):
    hub_id: int
    hub_code: str
    hub_name: str

    class Config:
        from_attributes = True

class PricingRuleCreate(BaseModel):
    from_province_id: Optional[int] = None
    to_province_id: Optional[int] = None
    zone_name: Optional[str] = None
    service_type: str = "STANDARD"
    min_weight: float = 0
    max_weight: float
    price: float = Field(gt=0)
    pricing_method: str = "FIXED"
    base_weight: Optional[float] = None
    increment_weight: Optional[float] = None
    increment_price: Optional[float] = None
    fuel_surcharge_percent: float = 10
    vat_percent: float = 8
    policy_id: int = 1
    is_active: bool = True

class PricingRuleResponse(PricingRuleCreate):
    rule_id: int
    origin_hub_id: Optional[int] = None
    dest_hub_id: Optional[int] = None
    origin_hub: Optional[HubNested] = None
    dest_hub: Optional[HubNested] = None

    class Config:
        from_attributes = True

class PricingPolicyResponse(BaseModel):
    policy_id: int
    policy_code: str
    policy_name: str
    policy_type: str
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    is_approved: Optional[bool] = False
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True

class PricingPolicyCreate(BaseModel):
    policy_code: str = Field(min_length=2, max_length=50)
    policy_name: str = Field(min_length=2, max_length=255)
    policy_type: str = "CUSTOMER"
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    is_approved: bool = True
    is_active: bool = True

class ServiceConfigBase(BaseModel):
    service_code: str
    service_name: str
    fee_type: str = "FIXED"
    fee_value: float
    calculation_base: str = "FIXED"
    min_order_value: Optional[float] = None
    max_order_value: Optional[float] = None
    min_fee: Optional[float] = None
    is_active: bool = True

class ServiceConfigCreate(ServiceConfigBase):
    pass

class ServiceConfigResponse(ServiceConfigBase):
    id: int

    class Config:
        from_attributes = True

class PackingRuleBase(BaseModel):
    packing_type: str
    min_weight: float
    max_weight: float
    packing_fee: float = Field(ge=0)
    added_weight: float = Field(ge=0)
    is_active: bool = True

class PackingRuleCreate(PackingRuleBase):
    pass

class PackingRuleResponse(PackingRuleBase):
    id: int

    class Config:
        from_attributes = True

class RemoteAreaBase(BaseModel):
    province_id: int
    district_id: int
    ward_id: int
    fee: float
    is_active: bool = True

class RemoteAreaCreate(RemoteAreaBase):
    pass

class RemoteAreaResponse(RemoteAreaBase):
    id: int

    class Config:
        from_attributes = True

class ProvinceZoneBase(BaseModel):
    origin_province_id: int
    destination_province_id: int
    zone_name: str

class ProvinceZoneCreate(ProvinceZoneBase):
    pass

class ProvinceZoneResponse(ProvinceZoneBase):
    id: int

    class Config:
        from_attributes = True
