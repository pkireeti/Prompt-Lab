"""
Chat history and message assembly for PromptLab.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Generator, List, Optional, Tuple

from .model import GenerationOptions, OllamaModel


@dataclass
class Message:
    role: str  # "user" | "assistant"
    content: str


@dataclass
class ChatManager:
    """Manages messages and delegates generation to OllamaModel."""

    model: OllamaModel = field(default_factory=OllamaModel)
    messages: List[Message] = field(default_factory=list)
    system_prompt: str = (
        "You are a friendly, patient teacher. "
        "Explain clearly and stay helpful and respectful."
    )
    # Small models (e.g. qwen3:1.7b) often ignore role=system alone;
    # reinforcing rules on the latest user turn works much better.
    reinforce_system_on_user: bool = True

    def set_system_prompt(self, text: str) -> None:
        self.system_prompt = text.strip()

    def clear_history(self) -> None:
        self.messages.clear()

    def add_user_message(self, text: str) -> None:
        self.messages.append(Message(role="user", content=text.strip()))

    def add_assistant_message(self, text: str) -> None:
        self.messages.append(Message(role="assistant", content=text.strip()))

    def format_system_for_api(self) -> str:
        """System string sent to Ollama's top-level `system` field."""
        return self.system_prompt.strip()

    def _augment_user_content(self, user_content: str) -> str:
        """
        Wrap the latest user message so small models (e.g. qwen3:1.7b) follow rules.

        Uses a simple [RULES] / [QUESTION] format — works better than role=system alone.
        """
        rules = self.system_prompt.strip()
        if not rules:
            return user_content
        return f"[RULES]\n{rules}\n\n[QUESTION]\n{user_content}"

    def build_messages(self) -> Tuple[List[dict], str]:
        """
        Build chat API messages (user/assistant only) and system string.

        Returns (messages, system_prompt_for_api).
        """
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
