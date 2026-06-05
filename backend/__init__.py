"""PromptLab backend — Ollama integration and chat logic."""

from .model import OllamaModel, GenerationOptions
from .chat_manager import ChatManager
from .session_logger import SessionLogger

__all__ = ["OllamaModel", "GenerationOptions", "ChatManager", "SessionLogger"]



