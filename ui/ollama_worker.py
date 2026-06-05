"""
Background thread for Ollama requests (keeps the GUI responsive).
"""

from PyQt6.QtCore import QThread, pyqtSignal

from backend.chat_manager import ChatManager
from backend.model import GenerationOptions


class OllamaWorker(QThread):
    """Runs chat_manager.send_user_message off the main thread."""

    token_received = pyqtSignal(str)
    finished = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(
        self,
        chat_manager: ChatManager,
        user_text: str,
        options: GenerationOptions | None = None,
        stream: bool = False,
        system_prompt: str | None = None,
    ):
        super().__init__()
        self._chat = chat_manager
        self._user_text = user_text
        self._options = options
        self._stream = stream
        self._system_prompt = system_prompt

    def run(self) -> None:
        try:
            if self._system_prompt is not None:
                self._chat.set_system_prompt(self._system_prompt)

            model = self._chat.model
            if not model.is_server_running():
                raise ConnectionError(
                    "Ollama is not running. Start Ollama, then try again."
                )
            if not model.is_model_available():
                raise RuntimeError(
                    "Model qwen3:1.7b not found. Run: ollama pull qwen3:1.7b"
                )

            if self._stream:
                self._run_streaming()
            else:
                self._run_blocking()
        except Exception as exc:
            self.error.emit(str(exc))

    def _run_blocking(self) -> None:
        reply = self._chat.send_user_message(
            self._user_text,
            options=self._options,
            stream=False,
        )
        self.finished.emit(str(reply))

    def _run_streaming(self) -> None:
        stream_gen = self._chat.send_user_message(
            self._user_text,
            options=self._options,
            stream=True,
        )
        parts: list[str] = []
        for token in stream_gen:
            parts.append(token)
            self.token_received.emit(token)
        full_reply = "".join(parts)
        self._chat.finalize_streamed_reply(full_reply)
        self.finished.emit(full_reply)
