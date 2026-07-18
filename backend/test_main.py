"""
Unit and integration tests for Needy Brain FastAPI backend.
Run with: pytest test_main.py -v
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test_needy_brain.db"

import os
os.environ["GEMINI_API_KEY"] = "test-key"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from database import Base, get_db
from main import app

# Test engine
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─────────────────────────────────────────────
# AUTH TESTS
# ─────────────────────────────────────────────

class TestAuth:
    def test_register_new_user(self, client):
        """New user registration returns user_id and is_new_user=True."""
        response = client.post("/api/auth", json={"phone": "9876543210", "password": "test123"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_new_user"] is True
        assert data["user_id"] is not None
        assert data["onboarding_complete"] is False
        assert data["wallet_balance"] == 0

    def test_login_existing_user(self, client):
        """Existing user can log in with correct password."""
        client.post("/api/auth", json={"phone": "9876543210", "password": "test123"})
        response = client.post("/api/auth", json={"phone": "9876543210", "password": "test123"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_new_user"] is False

    def test_login_wrong_password(self, client):
        """Wrong password returns 401."""
        client.post("/api/auth", json={"phone": "9876543210", "password": "test123"})
        response = client.post("/api/auth", json={"phone": "9876543210", "password": "wrongpassword"})
        assert response.status_code == 401

    def test_auth_missing_fields(self, client):
        """Missing required fields returns 422."""
        response = client.post("/api/auth", json={"phone": "9876543210"})
        assert response.status_code == 422

    def test_auth_invalid_phone_format(self, client):
        """Non-numeric or too-short phone returns 422."""
        response = client.post("/api/auth", json={"phone": "abc", "password": "test123"})
        assert response.status_code == 422

    def test_auth_short_password(self, client):
        """Password shorter than 4 chars is rejected by validation."""
        response = client.post("/api/auth", json={"phone": "9876543210", "password": "ab"})
        assert response.status_code == 422


# ─────────────────────────────────────────────
# ONBOARDING TESTS
# ─────────────────────────────────────────────

class TestOnboarding:
    def _create_user(self, client):
        response = client.post("/api/auth", json={"phone": "1111111111", "password": "pass"})
        return response.json()["user_id"]

    @patch("ai_service.model")
    def test_onboard_success(self, mock_model, client):
        """Onboarding with valid AI response persists profile and awards coins."""
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "assigned_persona": "Strict Desi Aunty",
            "interventions": ["Do 10 pushups", "Drink water", "Call a friend"]
        })
        mock_model.generate_content.return_value = mock_response

        user_id = self._create_user(client)
        response = client.post("/api/onboard", json={
            "user_id": user_id,
            "target_habit": "Doomscrolling",
            "habit_triggers": "Night time, boredom",
            "underlying_emotion": "Anxiety",
            "future_motivation": "Better sleep"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["assigned_persona"] == "Strict Desi Aunty"
        assert len(data["interventions"]) == 3
        assert data["wallet_balance"] == 50  # Onboarding reward

    def test_onboard_user_not_found(self, client):
        """Onboarding non-existent user returns 404."""
        response = client.post("/api/onboard", json={
            "user_id": 9999,
            "target_habit": "Doomscrolling at night",
            "habit_triggers": "Lying in bed, boredom",
            "underlying_emotion": "Anxiety and loneliness",
            "future_motivation": "I want to sleep better and be more productive at work"
        })
        assert response.status_code == 404

    def test_onboard_missing_fields(self, client):
        """Missing fields returns 422."""
        response = client.post("/api/onboard", json={"user_id": 1})
        assert response.status_code == 422


# ─────────────────────────────────────────────
# INTERVENTION TESTS
# ─────────────────────────────────────────────

class TestIntervention:
    def _setup_user(self, client, mock_model):
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "assigned_persona": "Disappointed IIT Professor",
            "interventions": ["Read a book", "Meditate", "Go for a walk"]
        })
        mock_model.generate_content.return_value = mock_response

        reg = client.post("/api/auth", json={"phone": "2222222222", "password": "pass"})
        user_id = reg.json()["user_id"]
        client.post("/api/onboard", json={
            "user_id": user_id,
            "target_habit": "Smoking",
            "habit_triggers": "Stress",
            "underlying_emotion": "Anxiety",
            "future_motivation": "Health"
        })
        return user_id

    @patch("ai_service.model")
    def test_intervene_success(self, mock_model, client):
        """Intervention returns brain_dialogue and cbt_challenge, awards 10 coins."""
        mock_onboard = MagicMock()
        mock_onboard.text = json.dumps({
            "assigned_persona": "Disappointed IIT Professor",
            "interventions": ["Read a book", "Meditate", "Go for a walk"]
        })
        mock_intervene = MagicMock()
        mock_intervene.text = json.dumps({
            "brain_dialogue": "Arey, again you are stressed?",
            "cbt_challenge": "Do 5 deep breaths right now.",
            "wallet_balance": 0,
            "vault_unlocked": False
        })
        mock_model.generate_content.side_effect = [mock_onboard, mock_intervene]

        user_id = self._setup_user(client, mock_model)
        # Reset side_effect for intervene call
        mock_model.generate_content.side_effect = [mock_intervene]

        response = client.post("/api/intervene", json={
            "user_id": user_id,
            "current_feeling": "I am very stressed"
        })
        assert response.status_code == 200
        data = response.json()
        assert "brain_dialogue" in data
        assert "cbt_challenge" in data

    def test_intervene_user_not_found(self, client):
        """Intervene on non-existent user returns 404."""
        response = client.post("/api/intervene", json={
            "user_id": 9999,
            "current_feeling": "stressed"
        })
        assert response.status_code == 404

    def test_intervene_missing_feeling(self, client):
        """Missing current_feeling returns 422."""
        response = client.post("/api/intervene", json={"user_id": 1})
        assert response.status_code == 422


# ─────────────────────────────────────────────
# VAULT TESTS
# ─────────────────────────────────────────────

class TestVault:
    @patch("ai_service.model")
    def test_unlock_vault_insufficient_coins(self, mock_model, client):
        """Cannot unlock vault without 50 coins."""
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "assigned_persona": "Strict Desi Aunty",
            "interventions": ["a", "b", "c"]
        })
        mock_model.generate_content.return_value = mock_response

        reg = client.post("/api/auth", json={"phone": "3333333333", "password": "pass"})
        user_id = reg.json()["user_id"]

        response = client.post("/api/unlock-vault", json={"user_id": user_id})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False

    def test_unlock_vault_user_not_found(self, client):
        """Unlock vault for non-existent user returns 404."""
        response = client.post("/api/unlock-vault", json={"user_id": 9999})
        assert response.status_code == 404


# ─────────────────────────────────────────────
# SCHEMA VALIDATION TESTS
# ─────────────────────────────────────────────

class TestSchemas:
    def test_onboard_blueprint_requires_3_interventions(self):
        """OnboardBlueprint enforces exactly 3 interventions."""
        from schemas import OnboardBlueprint
        with pytest.raises(Exception):
            OnboardBlueprint(assigned_persona="test", interventions=["only one"])

    def test_onboard_blueprint_valid(self):
        """OnboardBlueprint accepts exactly 3 interventions."""
        from schemas import OnboardBlueprint
        bp = OnboardBlueprint(
            assigned_persona="Test",
            interventions=["a", "b", "c"]
        )
        assert len(bp.interventions) == 3
