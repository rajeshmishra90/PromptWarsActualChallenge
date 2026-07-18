import os
import json
import asyncio
import logging
from dataclasses import dataclass
from typing import List

import google.generativeai as genai
from schemas import OnboardBlueprint, InterveneResponse

logger = logging.getLogger(__name__)

# Initialize Gemini client once at startup
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in the environment.")
genai.configure(api_key=api_key)

# Gemini Flash for low-latency responses
_model = genai.GenerativeModel(
    "gemini-2.0-flash",
    generation_config={"response_mime_type": "application/json"},
)

# ---------------------------------------------------------------------------
# Internal data classes (avoid raw dicts propagating through the call stack)
# ---------------------------------------------------------------------------

@dataclass
class _InterveneResult:
    brain_dialogue: str
    cbt_challenge: str


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _safe_parse(text: str, required_keys: List[str]) -> dict:
    """Parse JSON from model response with validation."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Gemini returned non-JSON response: %s", text[:200])
        raise ValueError(f"AI returned an invalid response format: {exc}") from exc

    missing = [k for k in required_keys if k not in data]
    if missing:
        raise ValueError(f"AI response missing required keys: {missing}")
    return data


def _call_model(prompt: str) -> str:
    """Synchronous wrapper around the Gemini SDK call."""
    response = _model.generate_content(prompt)
    return response.text


# ---------------------------------------------------------------------------
# Public API — async so FastAPI can await without blocking the event loop
# ---------------------------------------------------------------------------

async def generate_onboard_profile(
    target_habit: str,
    habit_triggers: str,
    underlying_emotion: str,
    future_motivation: str,
) -> OnboardBlueprint:
    """Generate a personalised CBT onboarding blueprint via Gemini."""
    prompt = f"""
You are a brilliant, slightly sarcastic, but deeply caring AI therapist designed for an Indian audience.
A user wants to break a habit using Cognitive Behavioral Therapy (CBT).
Here is their profile:
- Target Habit: {target_habit}
- Triggers: {habit_triggers}
- Underlying Emotion they are escaping: {underlying_emotion}
- Motivation for the future: {future_motivation}

Based on this, create:
1. A funny, relatable Indian "persona" name for yourself to help them (e.g., 'Strict Desi Aunty', 'Disappointed IIT Professor', 'Dramatic Bollywood Mom').
2. Three specific, CBT-based behavioral interventions tailored to their specific triggers and emotions.

Output JSON exactly matching this schema:
{{
  "assigned_persona": "string",
  "interventions": ["string", "string", "string"]
}}
"""
    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(None, _call_model, prompt)
    data = _safe_parse(text, ["assigned_persona", "interventions"])
    return OnboardBlueprint(**data)


async def generate_intervention(
    persona: str,
    target_habit: str,
    interventions: list,
    current_feeling: str,
) -> _InterveneResult:
    """Generate a real-time CBT intervention response via Gemini."""
    prompt = f"""
You are "{persona}", a witty and sarcastic AI with an Indian (Desi) sense of humor.
Your user is struggling right now.
- Their habit to break: {target_habit}
- Their long-term interventions: {interventions}
- What they are feeling RIGHT NOW (SOS): {current_feeling}

Provide a humorous, culturally relatable (Indian context), but CBT-grounded response to stop them from doing the habit.
It should not be mean, but playfully sarcastic (like a caring but dramatic Indian relative or friend).
Then, provide a quick 'cbt_challenge' (a 1-minute action they can do immediately instead of the habit).

Output JSON exactly matching this schema:
{{
  "brain_dialogue": "string",
  "cbt_challenge": "string"
}}
"""
    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(None, _call_model, prompt)
    data = _safe_parse(text, ["brain_dialogue", "cbt_challenge"])
    return _InterveneResult(
        brain_dialogue=data["brain_dialogue"],
        cbt_challenge=data["cbt_challenge"],
    )
