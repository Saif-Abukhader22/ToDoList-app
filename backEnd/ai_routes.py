# backEnd/ai_routes.py
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="/ai", tags=["ai"])

api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not set")
client = OpenAI(api_key=api_key)  # can also add timeout=30


class AskBody(BaseModel):
    prompt: str

@router.post("/ask")
def ask(body: AskBody) -> Dict[str, Any]:

    try:
  
        resp = client.responses.create(
            model="gpt-4o-mini",
            input=body.prompt, 
        )
        text = resp.output_text
        return {"message": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
def chat_stream(body: ChatBody):
    def gen():
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[m.model_dump() for m in body.messages],
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield f"data: {delta}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")