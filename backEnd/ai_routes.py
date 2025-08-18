# backEnd/ai_routes.py
from typing import List, Literal, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os

router = APIRouter(prefix="/ai", tags=["ai"])

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class Msg(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatBody(BaseModel):
    messages: List[Msg]


@router.post("/chat")
def chat(body: ChatBody) -> Dict[str, Any]:
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[m.model_dump() for m in body.messages],
            temperature=0.7,
        )
        text = resp.choices[0].message.content
        return {"message": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat-stream")
def chat_stream(body: ChatBody):
    """Example of streaming responses."""
    try:
        with client.chat.completions.stream(
            model="gpt-4o-mini",
            messages=[m.model_dump() for m in body.messages],
        ) as stream:
            for event in stream:
                if event.type == "message.delta" and event.delta.get("content"):
                    yield event.delta["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
