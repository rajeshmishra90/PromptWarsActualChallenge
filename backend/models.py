from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import TypeDecorator, TEXT
import json
from database import Base

# Fallback for SQLite to simulate JSONB
class JSONEncodedDict(TypeDecorator):
    impl = TEXT

    def process_bind_param(self, value, dialect):
        if value is not None:
            value = json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            value = json.loads(value)
        return value

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    target_habit = Column(String, nullable=False)
    danger_zone_time = Column(String, nullable=False)
    future_motivation = Column(Text, nullable=False)
    assigned_persona = Column(String, nullable=False)
    # Use JSONB for Postgres, or fallback to TEXT for SQLite
    interventions = Column(JSONEncodedDict, nullable=False)
    
    # Wallet & Rewards
    wallet_balance = Column(Integer, default=0, nullable=False)
    vault_unlocked = Column(Integer, default=0, nullable=False) # SQLite doesn't have Boolean by default, using Integer 0/1 or we can use sqlalchemy.Boolean

