from pydantic import BaseModel, Field
from typing import List

class OnboardBlueprint(BaseModel):
    assigned_persona: str
    interventions: List[str] = Field(..., min_length=3, max_length=3)

class OnboardRequest(BaseModel):
    target_habit: str
    danger_zone_time: str
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
