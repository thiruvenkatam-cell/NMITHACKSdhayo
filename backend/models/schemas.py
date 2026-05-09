from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegisterSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class LocationSchema(BaseModel):
    type: str = "Point"
    coordinates: list[float] = Field(..., description="[longitude, latitude]")

class OrderCreateSchema(BaseModel):
    order_type: str = Field(..., pattern="^(canteen_delivery|p2p_lend)$")
    item: str = Field(..., min_length=2, max_length=100)
    pickup_name: str
    drop_name: str
    pickup_location: LocationSchema
    drop_location: LocationSchema
    priority: str = Field(default="normal", pattern="^(normal|urgent)$")
