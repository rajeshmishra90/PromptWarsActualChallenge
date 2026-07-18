from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from google import genai
from google.genai import types

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

class TestRequest(BaseModel):
    prompt: str

class TestResponse(BaseModel):
    message: str
    gemini_response: str

@app.post("/api/test-gemini", response_model=TestResponse)
async def test_gemini(payload: TestRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    # Simple generation to verify integration
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=f"Respond with a short greeting and say: 'Gemini Integration is Working! Received: {payload.prompt}'"
    )
    
    return TestResponse(
        message="Backend connected successfully!",
        gemini_response=response.text
    )
