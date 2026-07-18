from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import re


class AuthRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15, description="Mobile phone number")
    password: str = Field(..., min_length=4, max_length=128, description="User password")

    @field_validator("phone")
    @classmethod
    def phone_must_be_numeric(cls, v: str) -> str:
        if not re.match(r"^\d{10,15}$", v):
            raise ValueError("Phone must be 10-15 digits")
        return v


class AuthResponse(BaseModel):
    user_id: int
    is_new_user: bool
    onboarding_complete: bool
    wallet_balance: int
    vault_unlocked: bool
    # Optional profile fields (populated on re-login)
    target_habit: Optional[str] = None
    habit_triggers: Optional[str] = None
    underlying_emotion: Optional[str] = None
    future_motivation: Optional[str] = None
    assigned_persona: Optional[str] = None
    interventions: Optional[List[str]] = None


class OnboardBlueprint(BaseModel):
    assigned_persona: str
    interventions: List[str] = Field(..., min_length=3, max_length=3)


class OnboardRequest(BaseModel):
    user_id: int
    target_habit: str = Field(..., min_length=3, max_length=200)
    habit_triggers: str = Field(..., min_length=3, max_length=500)
    underlying_emotion: str = Field(..., min_length=2, max_length=200)
    future_motivation: str = Field(..., min_length=5, max_length=1000)


class OnboardResponse(BaseModel):
    user_id: int
    assigned_persona: str
    interventions: List[str]
    wallet_balance: int
    vault_unlocked: bool


class InterveneRequest(BaseModel):
    user_id: int
    current_feeling: str = Field(..., min_length=3, max_length=500)


class InterveneResponse(BaseModel):
    brain_dialogue: str
    cbt_challenge: str
    wallet_balance: int
    vault_unlocked: bool


class UnlockVaultRequest(BaseModel):
    user_id: int


class UnlockVaultResponse(BaseModel):
    success: bool
    wallet_balance: int
    vault_unlocked: bool
    message: str
