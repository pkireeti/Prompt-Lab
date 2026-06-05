"""
Ollama API client for PromptLab.

Uses /api/chat with proper roles (system / user / assistant).
Model: qwen3:1.7b only.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Generator, List, Optional

import requests

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "qwen3:1.7b"


@dataclass
class GenerationOptions:
    """LLM sampling parameters — mirrors Ollama 'options' payload."""

    temperature: float = 1.0
    top_k: int = 40
    top_p: float = 0.9
    num_predict: int = 200  # max tokens
    repeat_penalty: float = 1.1
    seed: int = 42
    random_seed: bool = False  # when True, Ollama uses seed=-1 (non-reproducible)

    def to_ollama_options(self) -> dict:
        return {
            "temperature": float(self.temperature),
            "top_k": int(self.top_k),
            "top_p": float(self.top_p),
            "num_predict": int(self.num_predict),
            "repeat_penalty": float(self.repeat_penalty),
            "seed": -1 if self.random_seed else int(self.seed),
        }


class OllamaModel:
    """Wrapper around Ollama's /api/chat endpoint."""

    def __init__(
        self,
        model_name: str = MODEL_NAME,
        base_url: str = OLLAMA_BASE_URL,
        timeout: int = 120,
    ):
        self.model_name = model_name
        self.base_url = base_url
        self.chat_url = f"{base_url}/api/chat"
        self.tags_url = f"{base_url}/api/tags"
        self.timeout = timeout

    @staticmethod
    def list_available_models(base_url: str = OLLAMA_BASE_URL) -> list[str]:
        try:
            response = requests.get(f"{base_url}/api/tags", timeout=5)
            response.raise_for_status()
            models = response.json().get("models", [])
            return sorted(m.get("name", "") for m in models)
        except requests.RequestException:
            return []

    def is_server_running(self) -> bool:
        try:
            response = requests.get(self.tags_url, timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False

    def is_model_available(self) -> bool:
        try:
            response = requests.get(self.tags_url, timeout=5)
            response.raise_for_status()
            models = response.json().get("models", [])
            names = {m.get("name", "") for m in models}
            return any(
                name == self.model_name or name.startswith(f"{self.model_name}")
                for name in names
            )
        except requests.RequestException:
            return False

    def chat(
        self,
        messages: List[dict],
        options: Optional[GenerationOptions] = None,
        stream: bool = False,
        system: Optional[str] = None,
    ) -> str | Generator[str, None, None]:
        """
        Send messages to Ollama chat API.

        messages: user/assistant turns only (system goes in `system` field).
        system: top-level system prompt (stronger than role=system for small models).
        """
        opts = options or GenerationOptions()
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": stream,
            "think": False,
            "options": opts.to_ollama_options(),
        }
        if system and system.strip():
            payload["system"] = system.strip()

        if stream:
            return self._stream_chat(payload)
        return self._blocking_chat(payload)

    def _blocking_chat(self, payload: dict) -> str:
        response = requests.post(
            self.chat_url,
            json={**payload, "stream": False},
            timeout=self.timeout,
        )
        response.raise_for_status()
        data = response.json()
        message = data.get("message", {})
        return self._extract_message_text(message)

    def _stream_chat(self, payload: dict) -> Generator[str, None, None]:
        with requests.post(
            self.chat_url,
            json={**payload, "stream": True},
            stream=True,
            timeout=self.timeout,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                chunk = json.loads(line)
                token = self._chunk_token(chunk)
                if token:
                    yield token
                if chunk.get("done"):
                    break

    @staticmethod
    def _extract_message_text(message: dict) -> str:
        text = (message.get("content") or "").strip()
        if not text:
            text = (message.get("thinking") or "").strip()
        return text

    @staticmethod
    def _chunk_token(chunk: dict) -> str:
        message = chunk.get("message") or {}
        return message.get("content") or message.get("thinking") or ""
