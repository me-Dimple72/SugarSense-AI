import os
import json
from typing import Optional, List, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

APP_TITLE = "DiabetesCare API (Groq Cloud AI)"
APP_VERSION = "1.0.0"

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set. Create .env with your key.")

MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-8b-instant")

MEMORY_FILE = "chat_memory.json"
MAX_MEMORY_TURNS = int(os.getenv("MAX_MEMORY_TURNS", "10"))
REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "30"))

client = Groq(api_key=GROQ_API_KEY)

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

# -------------
# CORS (open)
# -------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthData(BaseModel):
    sugar: Optional[str] = ""
    medication: Optional[str] = ""
    activity: Optional[str] = ""

class ChatMessage(BaseModel):
    message: str

def load_memory() -> List[Dict[str, str]]:
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_memory(messages: List[Dict[str, str]]):
    try:
        trimmed = messages[-MAX_MEMORY_TURNS:]
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(trimmed, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving memory: {e}")


def system_prompt() -> str:
    return (
        "You are an expert diabetes health assistant. Provide clear, practical, "
        "and supportive guidance on blood sugar management, diet, exercise, and medications. "
        "Always remind users to consult their healthcare provider for medical decisions. "
        "Keep responses concise (4-6 sentences) and actionable."
    )


def build_analysis_prompt(data: HealthData) -> str:
    sugar = (data.sugar or "").strip() or "Not provided"
    medication = (data.medication or "").strip() or "Not provided"
    activity = (data.activity or "").strip() or "Not provided"

    return f"""Analyze this diabetes patient data and provide a comprehensive health report:

📊 Patient Data:
- Blood Sugar Level: {sugar} mg/dL
- Medications Taken: {medication}
- Daily Activities & Food: {activity}

Please provide:
1. 📊 Blood Sugar Status (evaluate against 70-140 mg/dL range)
2. 🍽️ Diet Analysis (identify concerning foods like sweets, high carbs)
3. 💡 Recommendations (give 5-7 specific, actionable tips)
4. ⚠️ Urgent Actions (if blood sugar is dangerously low <70 or high >300)

Format your response clearly with headers and bullet points. Be supportive and encouraging."""

def groq_chat(messages: List[Dict[str, str]]) -> str:
    try:
        resp = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.7,
            max_tokens=800,
            top_p=1,
            stream=False
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        error_msg = str(e)
        # Check for common errors
        if "model" in error_msg.lower() or "decommission" in error_msg.lower():
            return f"❌ Model Error: The model '{MODEL_NAME}' is not available. Please update MODEL_NAME in .env to 'llama-3.1-8b-instant'"
        elif "api" in error_msg.lower() or "key" in error_msg.lower():
            return "❌ API Key Error: Please check your GROQ_API_KEY in the .env file."
        elif "rate" in error_msg.lower() or "limit" in error_msg.lower():
            return "⏳ Rate Limit: Too many requests. Please wait a moment and try again."
        else:
            return f"❌ Error: {error_msg}"
        

@app.get("/")
async def root():
    return {
        "message": "✅ DiabetesCare API is running!",
        "version": APP_VERSION,
        "model": MODEL_NAME,
        "status": "online",
        "endpoints": {
            "analyze": "POST /analyze - Analyze health data",
            "chat": "POST /chat - Chat with AI assistant",
            "memory_get": "GET /memory - View chat history",
            "memory_clear": "DELETE /memory - Clear chat history",
        },
    }

@app.post("/analyze")
async def analyze_health(data: HealthData):
    try:
        messages = [
            {"role": "system", "content": system_prompt()},
            {"role": "user", "content": build_analysis_prompt(data)},
        ]
        reply = groq_chat(messages)
        return {"success": True, "analysis": reply}
    except Exception as e:
        return {"success": False, "analysis": f"Error: {str(e)}"}
    
@app.post("/chat")
async def chat(msg: ChatMessage):
    try:
        user_text = msg.message.strip()
        if not user_text:
            return {"success": True, "reply": "Please ask a question about diabetes management."}

        memory = load_memory()
        context: List[Dict[str, str]] = [{"role": "system", "content": system_prompt()}]
        
        # Add conversation history (last 6 messages)
        for m in memory[-(MAX_MEMORY_TURNS-2):]:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role in ("user", "assistant"):
                context.append({"role": role, "content": content})

        context.append({"role": "user", "content": user_text})

        reply = groq_chat(context)
        memory.append({"role": "user", "content": user_text})
        memory.append({"role": "assistant", "content": reply})
        save_memory(memory)

        return {"success": True, "reply": reply}
    except Exception as e:
        return {"success": False, "reply": f"Error: {str(e)}"}


@app.get("/memory")
async def get_memory():
    return {"memory": load_memory(), "max_turns": MAX_MEMORY_TURNS}

@app.delete("/memory")
async def clear_memory():
    if os.path.exists(MEMORY_FILE):
        os.remove(MEMORY_FILE)
    return {"message": "Memory cleared successfully!"}

if __name__ == "__main__":
    import uvicorn
    print(f"🚀 Starting DiabetesCare API with model: {MODEL_NAME}")
    print(f"📍 API will be available at: http://127.0.0.1:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

