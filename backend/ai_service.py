import os
import google.generativeai as genai
import json
from schemas import OnboardBlueprint, InterveneResponse

# Initialize Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in the environment.")
genai.configure(api_key=api_key)

# We use Gemini 3.5 Flash for speed, but the environment may be overriden by standard genai config
# It's fine to just use gemini-1.5-flash as the standard fallback for this hackathon
model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

def generate_onboard_profile(target_habit: str, habit_triggers: str, underlying_emotion: str, future_motivation: str):
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
    response = model.generate_content(prompt)
    data = json.loads(response.text)
    return OnboardBlueprint(**data)

def generate_intervention(persona: str, target_habit: str, interventions: list, current_feeling: str):
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
  "cbt_challenge": "string",
  "wallet_balance": 0,
  "vault_unlocked": false
}}
"""
    response = model.generate_content(prompt)
    data = json.loads(response.text)
    
    # We ignore the dummy wallet fields from AI and just return the strings, the main app handles DB wallet logic
    class DummyInterveneRes:
        pass
    res = DummyInterveneRes()
    res.brain_dialogue = data["brain_dialogue"]
    res.cbt_challenge = data["cbt_challenge"]
    return res
