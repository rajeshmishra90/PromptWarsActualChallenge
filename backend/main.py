from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from database import engine, get_db, Base
import models
import schemas
import ai_service

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load .env file variables manually if it exists locally
if os.path.exists(".env"):
    with open(".env") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key.strip()] = val.strip()

@app.post("/api/onboard", response_model=schemas.OnboardResponse)
async def onboard_user(payload: schemas.OnboardRequest, db: Session = Depends(get_db)):
    try:
        blueprint = ai_service.generate_onboard_profile(
            target_habit=payload.target_habit,
            danger_zone_time=payload.danger_zone_time,
            future_motivation=payload.future_motivation
        )
        
        db_user = models.User(
            target_habit=payload.target_habit,
            danger_zone_time=payload.danger_zone_time,
            future_motivation=payload.future_motivation,
            assigned_persona=blueprint.assigned_persona,
            interventions=blueprint.interventions,
            wallet_balance=50, # Initial welcome bonus
            vault_unlocked=0
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return schemas.OnboardResponse(
            user_id=db_user.id,
            assigned_persona=db_user.assigned_persona,
            interventions=db_user.interventions,
            wallet_balance=db_user.wallet_balance,
            vault_unlocked=bool(db_user.vault_unlocked)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/intervene", response_model=schemas.InterveneResponse)
async def intervene(payload: schemas.InterveneRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        response = ai_service.generate_intervention(
            persona=db_user.assigned_persona,
            target_habit=db_user.target_habit,
            interventions=db_user.interventions,
            current_feeling=payload.current_feeling
        )
        
        # Reward user with 10 coins for using the intervention system
        db_user.wallet_balance += 10
        db.commit()
        
        return schemas.InterveneResponse(
            brain_dialogue=response.brain_dialogue,
            cbt_challenge=response.cbt_challenge,
            wallet_balance=db_user.wallet_balance,
            vault_unlocked=bool(db_user.vault_unlocked)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/unlock-vault", response_model=schemas.UnlockVaultResponse)
async def unlock_vault(payload: schemas.UnlockVaultRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if db_user.vault_unlocked:
        return schemas.UnlockVaultResponse(
            success=False,
            wallet_balance=db_user.wallet_balance,
            vault_unlocked=True,
            message="Vault is already unlocked."
        )
        
    if db_user.wallet_balance < 50:
        return schemas.UnlockVaultResponse(
            success=False,
            wallet_balance=db_user.wallet_balance,
            vault_unlocked=False,
            message="Not enough coins. You need 50 coins to unlock the vault."
        )
        
    # Unlock and deduct coins
    db_user.wallet_balance -= 50
    db_user.vault_unlocked = 1
    db.commit()
    
    return schemas.UnlockVaultResponse(
        success=True,
        wallet_balance=db_user.wallet_balance,
        vault_unlocked=True,
        message="Vault unlocked successfully!"
    )
