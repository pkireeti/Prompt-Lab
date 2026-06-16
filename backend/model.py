"""
Ollama and OpenAI-compatible API clients for PromptLab.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Generator, List, Optional

import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = "qwen3:1.7b"

OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4", "gpt-3.5-turbo"]


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


class ApiModel:
    """OpenAI-compatible API client (works with OpenAI, Groq, Together, etc.)."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.openai.com/v1",
        timeout: int = 120,
    ):
        self.api_key = (
            api_key.strip()
            .replace("\u200b", "")
            .replace("\u200c", "")
            .replace("\u200d", "")
            .replace("\ufeff", "")
        )
        self.base_url = base_url.rstrip("/")
        self.chat_url = f"{self.base_url}/chat/completions"
        self.models_url = f"{self.base_url}/models"
        self.timeout = timeout
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def list_available_models(
        api_key: str, base_url: str = "https://api.openai.com/v1"
    ) -> list[str]:
        try:
            clean_key = (
                api_key.strip()
                .replace("\u200b", "")
                .replace("\u200c", "")
                .replace("\u200d", "")
                .replace("\ufeff", "")
            )
            headers = {
                "Authorization": f"Bearer {clean_key}",
                "Content-Type": "application/json",
            }
            response = requests.get(
                f"{base_url.rstrip('/')}/models", headers=headers, timeout=5
            )
            response.raise_for_status()
            data = response.json()
            return sorted(
                m["id"]
                for m in data.get("data", [])
                if not m.get("id", "").startswith("ft:")
            )
        except requests.RequestException:
            return []

    def chat(
        self,
        messages: List[dict],
        model: str = "gpt-4o-mini",
        options: Optional[GenerationOptions] = None,
        stream: bool = False,
        system: Optional[str] = None,
    ) -> str | Generator[str, None, None]:
        opts = options or GenerationOptions()
        api_messages = list(messages)
        if system and system.strip():
            api_messages.insert(0, {"role": "system", "content": system.strip()})
        payload = {
            "model": model,
            "messages": api_messages,
            "temperature": opts.temperature,
            "top_p": opts.top_p,
            "max_tokens": opts.num_predict,
            "seed": None if opts.random_seed else opts.seed,
            "stream": stream,
        }
        if stream:
            return self._stream_chat(payload)
        return self._blocking_chat(payload)

    def _blocking_chat(self, payload: dict) -> str:
        response = requests.post(
            self.chat_url,
            headers=self.headers,
            json={**payload, "stream": False},
            timeout=self.timeout,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "") or ""
        return ""

    def _stream_chat(self, payload: dict) -> Generator[str, None, None]:
        with requests.post(
            self.chat_url,
            headers=self.headers,
            json=payload,
            stream=True,
            timeout=self.timeout,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        choices = chunk.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                    except json.JSONDecodeError:
                        continue
