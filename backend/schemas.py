from pydantic import BaseModel, Field
from typing import List, Optional

class AuthRequest(BaseModel):
    phone: str
    password: str

class AuthResponse(BaseModel):
    user_id: int
    is_new_user: bool
    # User might already have a profile if they login again
    onboarding_complete: bool
    wallet_balance: int
    vault_unlocked: bool
    # Optional profile fields
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
    target_habit: str
    habit_triggers: str
    underlying_emotion: str
    future_motivation: str

class OnboardResponse(BaseModel):
    user_id: int
    assigned_persona: str
    interventions: List[str]
    wallet_balance: int
    vault_unlocked: bool

class InterveneRequest(BaseModel):
    user_id: int
    current_feeling: str

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
