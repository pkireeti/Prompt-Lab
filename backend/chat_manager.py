"""
Chat history and message assembly for PromptLab.
Supports both Ollama (local) and OpenAI-compatible API models.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Generator, List, Optional, Tuple, Union

from .model import GenerationOptions, OllamaModel, ApiModel


@dataclass
class Message:
    role: str
    content: str


@dataclass
class ChatManager:
    model: OllamaModel = field(default_factory=OllamaModel)
    api_model: Optional[ApiModel] = None
    api_key: str = ""
    use_api: bool = False
    api_model_name: str = "gpt-4o-mini"
    messages: List[Message] = field(default_factory=list)
    system_prompt: str = (
        "You are a friendly, patient teacher. "
        "Explain clearly and stay helpful and respectful."
    )
    reinforce_system_on_user: bool = True

    def set_api_key(self, api_key: str, base_url: str = "") -> None:
        clean = (
            api_key.strip()
            .replace("\u200b", "")
            .replace("\u200c", "")
            .replace("\u200d", "")
            .replace("\ufeff", "")
        )
        self.api_key = clean
        if clean:
            if not base_url:
                if clean.lower().startswith("nvapi") or "nvapi" in clean.lower():
                    base_url = "https://integrate.api.nvidia.com/v1"
                elif clean.startswith("gsk_"):
                    base_url = "https://api.groq.com/openai/v1"
                elif clean.startswith("pplx-"):
                    base_url = "https://api.perplexity.ai"
                else:
                    base_url = "https://api.openai.com/v1"
            self.api_model = ApiModel(api_key=clean, base_url=base_url)
            self.use_api = True
        else:
            self.api_model = None
            self.use_api = False

    def set_use_api(self, use: bool) -> None:
        self.use_api = use and bool(self.api_key)

    def set_api_model_name(self, name: str) -> None:
        self.api_model_name = name

    def set_system_prompt(self, text: str) -> None:
        self.system_prompt = text.strip()

    def clear_history(self) -> None:
        self.messages.clear()

    def add_user_message(self, text: str) -> None:
        self.messages.append(Message(role="user", content=text.strip()))

    def add_assistant_message(self, text: str) -> None:
        self.messages.append(Message(role="assistant", content=text.strip()))

    def format_system_for_api(self) -> str:
        prompt = self.system_prompt.strip()
        if self.use_api and self.api_model_name:
            prompt += (
                f"\n\nYou are currently running via API as model: {self.api_model_name}"
            )
        elif not self.use_api:
            prompt += f"\n\nYou are currently running locally as model: {self.model.model_name}"
        return prompt

    def _augment_user_content(self, user_content: str) -> str:
        rules = self.system_prompt.strip()
        if not rules:
            return user_content
        return f"[RULES]\n{rules}\n\n[QUESTION]\n{user_content}"

    def build_messages(self) -> Tuple[List[dict], str]:
        api_messages: List[dict] = []
        last_index = len(self.messages) - 1

        for i, msg in enumerate(self.messages):
            if msg.role not in ("user", "assistant"):
                continue
            content = msg.content
            if (
                self.reinforce_system_on_user
                and msg.role == "user"
                and i == last_index
                and self.system_prompt.strip()
                and not self.use_api
            ):
                content = self._augment_user_content(content)
            api_messages.append({"role": msg.role, "content": content})

        return api_messages, self.format_system_for_api()

    def send_user_message(
        self,
        user_text: str,
        options: Optional[GenerationOptions] = None,
        stream: bool = False,
    ) -> str | Generator[str, None, None]:
        self.add_user_message(user_text)
        api_messages, system = self.build_messages()

        if self.use_api and self.api_model:
            result = self.api_model.chat(
                messages=api_messages,
                model=self.api_model_name,
                options=options,
                stream=stream,
                system=system or None,
            )
        else:
            result = self.model.chat(
                messages=api_messages,
                system=system or None,
                options=options,
                stream=stream,
            )

        if stream:
            return result
        self.add_assistant_message(result)
        return result

    def finalize_streamed_reply(self, full_text: str) -> None:
        self.add_assistant_message(full_text)
