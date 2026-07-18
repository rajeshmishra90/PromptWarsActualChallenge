from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import TypeDecorator, TEXT
import json
from database import Base

# Fallback for SQLite to simulate JSONB
class JSONEncodedDict(TypeDecorator):
    """Stores a Python list/dict as JSON text, compatible with SQLite and PostgreSQL."""

    impl = TEXT
    cache_ok = True  # Required by SQLAlchemy 1.4+ for caching safety

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
    phone = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Stored as HMAC-SHA256 hash
    
    # CBT Fields (nullable=True because they are filled during onboarding, after auth)
    target_habit = Column(String, nullable=True)
    habit_triggers = Column(String, nullable=True)
    underlying_emotion = Column(String, nullable=True)
    future_motivation = Column(Text, nullable=True)
    
    # AI Profile
    assigned_persona = Column(String, nullable=True)
    interventions = Column(JSONEncodedDict, nullable=True)
    
    # Wallet & Rewards
    wallet_balance = Column(Integer, default=0, nullable=False)
    vault_unlocked = Column(Integer, default=0, nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} phone={self.phone!r} balance={self.wallet_balance}>"

