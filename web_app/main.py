"""
PromptLab — SaaS Web Backend (FastAPI)
"""

from __future__ import annotations

import json
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.model import GenerationOptions, OllamaModel, ApiModel
from backend.chat_manager import ChatManager
from backend.session_logger import SessionLogger, DATA_DIR

DEFAULT_NVIDIA_KEY = (
    "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"
)
DEFAULT_NVIDIA_MODEL = "google/diffusiongemma-26b-a4b-it"

app = FastAPI(title="PromptLab")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = Path(__file__).resolve().parent
DIST = BASE / "frontend" / "dist"

app.mount("/assets", StaticFiles(directory=str(DIST / "assets")), name="assets")

sessions: dict[str, ChatManager] = {}
logger = SessionLogger()
SESSION_META = DATA_DIR / "sessions.json"


def _save_session_meta():
    """Persist session metadata to JSON (title from first user message)."""
    data = []
    for sid, cm in sessions.items():
        user_msgs = [m.content for m in cm.messages if m.role == "user"]
        title = (
            user_msgs[0][:60] + ("…" if len(user_msgs[0]) > 60 else "")
            if user_msgs
            else "New session"
        )
        data.append(
            {
                "id": sid,
                "title": title,
                "timestamp": datetime.now().isoformat(timespec="seconds"),
                "messages": len(cm.messages),
                "model": cm.api_model_name if cm.use_api else "local",
            }
        )
    with open(SESSION_META, "w") as f:
        json.dump(data, f, indent=2)


def _load_session_meta() -> list[dict]:
    if SESSION_META.exists():
        with open(SESSION_META) as f:
            return json.load(f)
    return []


class ChatRequest(BaseModel):
    session_id: str
    message: str
    temperature: float = 1.0
    top_k: int = 40
    top_p: float = 0.9
    max_tokens: int = 200
    repeat_penalty: float = 1.1
    seed: int = 42
    random_seed: bool = False
    system_prompt: str | None = None
    stream: bool = True
    api_key: str = ""
    use_api: bool = False
    api_model: str = "gpt-4o-mini"
    api_base_url: str = "https://api.openai.com/v1"
    mode: str = "nvidia"


class SettingsRequest(BaseModel):
    session_id: str
    settings: dict[str, Any]


def _get_session(session_id: str) -> ChatManager:
    if session_id not in sessions:
        sessions[session_id] = ChatManager()
    return sessions[session_id]


@app.get("/")
async def index():
    return FileResponse(str(DIST / "index.html"))


@app.get("/favicon.svg")
async def favicon():
    return FileResponse(str(DIST / "favicon.svg"))


@app.get("/logo.svg")
async def logo():
    return FileResponse(str(DIST / "logo.svg"))


@app.get("/api/session")
async def create_session():
    session_id = uuid.uuid4().hex[:12]
    sessions[session_id] = ChatManager()
    _save_session_meta()
    return {"session_id": session_id}


@app.get("/api/sessions")
async def list_sessions():
    return {"sessions": _load_session_meta()}


@app.post("/api/sessions/delete")
async def delete_session(req: dict):
    sid = req.get("session_id", "")
    sessions.pop(sid, None)
    _save_session_meta()
    return {"status": "ok"}


@app.get("/api/health")
async def health():
    model = OllamaModel()
    running = model.is_server_running()
    available = model.is_model_available() if running else False
    models = OllamaModel.list_available_models() if running else []
    return {
        "ollama_running": running,
        "model_available": available,
        "models": models,
        "selected_model": model.model_name,
    }


@app.get("/api/models")
async def list_models():
    models = OllamaModel.list_available_models()
    return {"models": models}


@app.post("/api/api-models")
async def list_api_models(req: dict):
    mode = req.get("mode", "nvidia")
    api_key = req.get("api_key", "")
    base_url = req.get("base_url", "https://api.openai.com/v1")
    if not api_key:
        if mode == "nvidia":
            api_key = DEFAULT_NVIDIA_KEY
            base_url = "https://integrate.api.nvidia.com/v1"
        else:
            return {"models": []}
    models = ApiModel.list_available_models(api_key, base_url)
    if not models:
        if mode == "nvidia":
            models = [DEFAULT_NVIDIA_MODEL]
        else:
            models = ["gpt-4o-mini", "gpt-4o", "gpt-4", "gpt-3.5-turbo"]
    return {"models": models}


@app.get("/api/settings")
async def get_settings():
    s = logger.load_settings()
    return s or {}


@app.post("/api/settings")
async def save_settings(req: SettingsRequest):
    logger.save_settings(req.settings)
    return {"status": "ok"}


@app.get("/api/history")
async def get_history(session_id: str):
    cm = _get_session(session_id)
    return {
        "messages": [{"role": m.role, "content": m.content} for m in cm.messages],
        "system_prompt": cm.system_prompt,
    }


@app.post("/api/chat")
async def chat(req: ChatRequest):
    cm = _get_session(req.session_id)

    if req.mode == "nvidia":
        cm.set_api_key(DEFAULT_NVIDIA_KEY, "https://integrate.api.nvidia.com/v1")
        cm.set_use_api(True)
        cm.set_api_model_name(req.api_model or DEFAULT_NVIDIA_MODEL)
    elif req.mode == "api" and req.api_key:
        cm.set_api_key(req.api_key, req.api_base_url)
        cm.set_use_api(True)
        if req.api_model:
            cm.set_api_model_name(req.api_model)
    else:
        cm.set_use_api(False)
        if req.mode == "local":
            model = OllamaModel()
            if not model.is_server_running():
                raise HTTPException(503, "Ollama is not running")

    if req.system_prompt is not None:
        cm.set_system_prompt(req.system_prompt)

    opts = GenerationOptions(
        temperature=req.temperature,
        top_k=req.top_k,
        top_p=req.top_p,
        num_predict=req.max_tokens,
        repeat_penalty=req.repeat_penalty,
        seed=req.seed,
        random_seed=req.random_seed,
    )

    if req.stream:
        return StreamingResponse(
            _stream_chat(cm, req.message, opts, req.system_prompt),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        reply = cm.send_user_message(req.message, options=opts, stream=False)
        _save_session_meta()
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(502, f"API error: {e}")


async def _stream_chat(
    cm: ChatManager, text: str, opts: GenerationOptions, system_prompt: str | None
) -> AsyncGenerator[str, None]:
    if system_prompt is not None:
        cm.set_system_prompt(system_prompt)

    result = cm.send_user_message(text, options=opts, stream=True)
    loop = asyncio.get_event_loop()

    def _generate():
        return result

    try:
        gen = await loop.run_in_executor(None, _generate)
        parts = []
        for token in gen:
            parts.append(token)
            yield f"data: {json.dumps({'token': token})}\n\n"
        full = "".join(parts)
        cm.finalize_streamed_reply(full)

        logger.log_exchange(
            user_message=text,
            assistant_message=full,
            options=opts,
            system_prompt=system_prompt or "",
            stream=True,
        )
        _save_session_meta()
        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@app.get("/api/export")
async def export_session():
    path = logger.export_session_json()
    return {"path": str(path)}


@app.get("/api/chart")
async def generate_chart():
    raise HTTPException(501, "Charts not available in web version")
