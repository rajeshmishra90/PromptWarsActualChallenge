import os
import json
from google import genai
from google.genai import types
from pydantic import TypeAdapter
from schemas import OnboardBlueprint, InterveneResponse

MODEL_NAME = "gemini-3.5-flash"

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=api_key)

def generate_onboard_profile(target_habit: str, danger_zone_time: str, future_motivation: str) -> OnboardBlueprint:
    client = get_client()
    
    system_instruction = (
        "You are the backend behavioral architect of the Needy Brain application. "
        "Your target is to process a user's toxic habit, their danger hours, and their personal aspirations. "
        "Based on this, dynamically designate an AI persona category (e.g., Cynical Socratic, Chronically Anxious Overthinker, Tough-Love Drill Sergeant) "
        "that best counterbalances their profile. Generate exactly three concrete, low-friction behavioral experiments derived from "
        "Cognitive Behavioral Therapy (CBT) designed to briefly delay or substitute their habit loop. "
        "Output must conform strictly to the provided JSON schema."
    )
    
    user_prompt = (
        f"Toxic Habit: {target_habit}\n"
        f"Danger Hours: {danger_zone_time}\n"
        f"Personal Aspiration: {future_motivation}"
    )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=OnboardBlueprint,
        ),
    )
    
    return OnboardBlueprint.model_validate_json(response.text)

def generate_intervention(persona: str, target_habit: str, interventions: list[str], current_feeling: str) -> InterveneResponse:
    client = get_client()
    
    system_instruction = (
        "You are the user's living 'Needy Brain' avatar. Fetch their historical profile. "
        "The user is currently experiencing a acute craving trigger. Address them directly using your designated persona tone. "
        "Use sharp, constructive humor and psychological reframing to expose the logical fallacy behind their immediate craving. "
        "Challenge them to execute one of their pre-generated behavioral interventions as a structural pattern-interrupter before they act."
    )
    
    interventions_text = "\n".join([f"- {i}" for i in interventions])
    user_prompt = (
        f"Designated Persona: {persona}\n"
        f"User's Toxic Habit: {target_habit}\n"
        f"Pre-generated Interventions:\n{interventions_text}\n"
        f"Current Feeling/Craving Trigger: {current_feeling}\n\n"
        "Generate a response addressing the user directly as their 'Needy Brain', exposing their logical fallacy and challenging them with one intervention. "
        "Output strictly as a JSON object matching the InterveneResponse schema."
    )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=InterveneResponse,
        ),
    )
    
    return InterveneResponse.model_validate_json(response.text)
