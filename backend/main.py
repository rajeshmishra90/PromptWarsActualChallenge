import os

# Load .env file variables manually if it exists locally before imports
if os.path.exists(".env"):
    with open(".env") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key.strip()] = val.strip()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
import models
import schemas
import ai_service
import json

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


@app.post("/api/auth", response_model=schemas.AuthResponse)
async def authenticate_user(payload: schemas.AuthRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == payload.phone).first()
    
    is_new = False
    if not db_user:
        # Register new user
        db_user = models.User(
            phone=payload.phone,
            password=payload.password, # Plaintext for hackathon
            wallet_balance=0,
            vault_unlocked=0
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        is_new = True
    else:
        # Verify password
        if db_user.password != payload.password:
            raise HTTPException(status_code=401, detail="Invalid password")
            
    # Check if onboarding is complete (they have a target habit)
    onboarding_complete = bool(db_user.target_habit)
    
    return schemas.AuthResponse(
        user_id=db_user.id,
        is_new_user=is_new,
        onboarding_complete=onboarding_complete,
        wallet_balance=db_user.wallet_balance,
        vault_unlocked=bool(db_user.vault_unlocked),
        target_habit=db_user.target_habit,
        habit_triggers=db_user.habit_triggers,
        underlying_emotion=db_user.underlying_emotion,
        future_motivation=db_user.future_motivation,
        assigned_persona=db_user.assigned_persona,
        interventions=db_user.interventions
    )


@app.post("/api/onboard", response_model=schemas.OnboardResponse)
async def onboard_user(payload: schemas.OnboardRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        blueprint = ai_service.generate_onboard_profile(
            target_habit=payload.target_habit,
            habit_triggers=payload.habit_triggers,
            underlying_emotion=payload.underlying_emotion,
            future_motivation=payload.future_motivation
        )
        
        db_user.target_habit = payload.target_habit
        db_user.habit_triggers = payload.habit_triggers
        db_user.underlying_emotion = payload.underlying_emotion
        db_user.future_motivation = payload.future_motivation
        db_user.assigned_persona = blueprint.assigned_persona
        db_user.interventions = blueprint.interventions
        db_user.wallet_balance += 50  # Reward for completing onboarding
        
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
