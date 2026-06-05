"""
Main application window — logs, settings, and polish (Step 6).
"""

from __future__ import annotations

import time

from PyQt6.QtGui import QAction
from PyQt6.QtWidgets import (
    QHBoxLayout,
    QMainWindow,
    QMessageBox,
    QStatusBar,
    QWidget,
)

from backend.chat_manager import ChatManager
from backend.model import OllamaModel
from backend.session_logger import SessionLogger
from .chat_panel import ChatBubble, ChatPanel
from .controls_panel import ControlsPanel
from .logs_dialog import LogsDialog
from .ollama_worker import OllamaWorker
from .theme import APP_STYLESHEET


class MainWindow(QMainWindow):
    """PromptLab main window."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("PromptLab — AI Teaching Lab")
        self.setMinimumSize(900, 560)
        self.resize(1050, 680)
        self.setStyleSheet(APP_STYLESHEET)

        self._logger = SessionLogger()
        self._chat_manager = ChatManager()
        self._worker: OllamaWorker | None = None
        self._pending_bubble: ChatBubble | None = None
        self._stream_buffer: str = ""
        self._last_user_text: str = ""
        self._last_options = None
        self._last_stream: bool = False
        self._request_started_at: float = 0.0

        central = QWidget()
        self.setCentralWidget(central)

        layout = QHBoxLayout(central)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        self.controls = ControlsPanel()
        self.chat = ChatPanel()

        layout.addWidget(self.controls)
        layout.addWidget(self.chat, stretch=1)

        self._status = QStatusBar()
        self.setStatusBar(self._status)

        self._build_menu()
        self._load_saved_settings()

        self.chat.message_sent.connect(self._on_user_message)
        self.controls.clear_chat_requested.connect(self._on_clear_chat)
        self.controls.system_prompt_changed.connect(self._on_system_prompt_changed)
        self.controls.model_changed.connect(self._on_model_changed)
        self._chat_manager.set_system_prompt(self.controls.get_system_prompt())
        self._refresh_model_list()
        self._show_startup_status()

    def _build_menu(self) -> None:
        menu = self.menuBar()
        menu.setStyleSheet(
            "QMenuBar { background: #000000; color: #ffffff; }"
            "QMenuBar::item:selected { background: #222222; }"
            "QMenu { background: #111111; color: #ffffff; }"
            "QMenu::item:selected { background: #333333; }"
        )

        file_menu = menu.addMenu("File")
        save_act = QAction("Save settings", self)
        save_act.triggered.connect(self._save_settings)
        file_menu.addAction(save_act)

        export_act = QAction("Export session (JSON)", self)
        export_act.triggered.connect(self._export_session)
        file_menu.addAction(export_act)

        file_menu.addSeparator()
        logs_act = QAction("View chat logs…", self)
        logs_act.triggered.connect(self._show_logs_dialog)
        file_menu.addAction(logs_act)

        tools_menu = menu.addMenu("Tools")
        chart_act = QAction("Generate temperature chart", self)
        chart_act.triggered.connect(self._generate_chart)
        tools_menu.addAction(chart_act)

        help_menu = menu.addMenu("Help")
        about_act = QAction("About PromptLab", self)
        about_act.triggered.connect(self._show_about)
        help_menu.addAction(about_act)

    def _load_saved_settings(self) -> None:
        settings = self._logger.load_settings()
        if settings:
            self.controls.apply_settings(settings)
            self._chat_manager.set_system_prompt(self.controls.get_system_prompt())
            self._status.showMessage(
                "Loaded saved settings from data/settings.json", 5000
            )

    def _save_settings(self) -> None:
        self._logger.save_settings(self.controls.get_settings_dict())
        self._status.showMessage("Settings saved to data/settings.json", 4000)

    def _export_session(self) -> None:
        path = self._logger.export_session_json()
        QMessageBox.information(self, "Exported", f"Session saved to:\n{path}")
        self._status.showMessage(f"Exported {path.name}", 5000)

    def _show_logs_dialog(self) -> None:
        LogsDialog(self._logger, self).exec()

    def _generate_chart(self) -> None:
        path = self._logger.plot_temperature_chart()
        if not path:
            QMessageBox.warning(
                self,
                "Not enough data",
                "Need at least 2 logged replies.\n\n"
                "Vary temperature with Random seed on, send a few messages, "
                "then try again.",
            )
            return
        QMessageBox.information(self, "Chart saved", f"Graph saved to:\n{path}")
        self._status.showMessage(f"Chart saved: {path.name}", 5000)

    def _show_about(self) -> None:
        QMessageBox.about(
            self,
            "About PromptLab",
            "PromptLab — AI Teaching Lab\n\n"
            "Local LLM experiments with Ollama.\n"
            "Logs: data/chat_history.csv\n"
            "Settings: data/settings.json\n"
            "Charts: graphs/",
        )

    def _refresh_model_list(self) -> None:
        models = OllamaModel.list_available_models()
        self.controls.populate_models(models)
        selected = self.controls.get_selected_model()
        if selected:
            self._chat_manager.model.model_name = selected

    def _on_model_changed(self, name: str) -> None:
        if not name:
            return
        self._chat_manager.model.model_name = name
        self._chat_manager.clear_history()
        self.chat.clear_chat()
        self._show_startup_status()

    def _show_startup_status(self) -> None:
        model_obj = self._chat_manager.model
        selected = self.controls.get_selected_model() or model_obj.model_name
        if model_obj.is_server_running() and model_obj.is_model_available():
            status = f"Ollama connected · {selected} ready."
        elif model_obj.is_server_running():
            status = (
                f"Ollama is running, but {selected} is missing.\n"
                "Run in terminal: ollama pull <model>"
            )
        else:
            status = "Ollama is not running.\nStart Ollama, then pull a model."

        self.chat.show_welcome(
            "Welcome to PromptLab — AI Teaching Lab.\n\n"
            f"{status}\n\n"
            "• Select a model from the dropdown above\n"
            "• Sliders + system prompt shape model behavior\n"
            "• File → View chat logs to see CSV history\n"
            "• Tools → Generate temperature chart after experiments\n"
            "• Settings auto-save when you close the app"
        )
        self.controls.set_connection_status(model_obj.is_server_running())

    def _on_system_prompt_changed(self, text: str) -> None:
        self._chat_manager.set_system_prompt(text)

    def _on_clear_chat(self) -> None:
        self._chat_manager.clear_history()
        self.chat.show_welcome(
            "Chat history cleared.\n\n"
            "Model memory reset. Logs on disk are kept.\n"
            "Send a new message to start fresh."
        )
        self._status.showMessage("Chat memory cleared (logs kept)", 3000)

    def _on_user_message(self, text: str) -> None:
        if self._worker is not None and self._worker.isRunning():
            return

        self._last_user_text = text
        self._last_options = self.controls.get_generation_options()
        self._last_stream = self.controls.is_stream_enabled()
        self._chat_manager.set_system_prompt(self.controls.get_system_prompt())
        self._request_started_at = time.perf_counter()

        self.chat.set_input_enabled(False)
        self.controls.set_controls_enabled(False)
        self._stream_buffer = ""

        if self._last_stream:
            self._pending_bubble = self.chat.begin_assistant_message("")
        else:
            self._pending_bubble = self.chat.begin_assistant_message("Thinking…")

        self._worker = OllamaWorker(
            self._chat_manager,
            text,
            self._last_options,
            stream=self._last_stream,
            system_prompt=self.controls.get_system_prompt(),
        )
        self._worker.finished.connect(self._on_reply_ready)
        self._worker.error.connect(self._on_reply_error)
        self._worker.finished.connect(self._cleanup_worker)
        self._worker.error.connect(self._cleanup_worker)

        if self._last_stream:
            self._worker.token_received.connect(self._on_token_received)

        self._worker.start()

    def _duration_ms(self) -> int:
        return int((time.perf_counter() - self._request_started_at) * 1000)

    def _log_turn(self, assistant_text: str, *, error: bool) -> None:
        if not self._last_options:
            return
        self._logger.log_exchange(
            user_message=self._last_user_text,
            assistant_message=assistant_text,
            options=self._last_options,
            system_prompt=self.controls.get_system_prompt(),
            stream=self._last_stream,
            error=error,
            duration_ms=self._duration_ms(),
        )
        self._status.showMessage(
            f"Logged · {len(assistant_text)} chars · {self._duration_ms()} ms",
            4000,
        )

    def _on_token_received(self, token: str) -> None:
        if not self._pending_bubble:
            return
        self._stream_buffer += token
        self.chat.append_to_message(self._pending_bubble, token)

    def _on_reply_ready(self, reply: str) -> None:
        if self._pending_bubble:
            final = (self._stream_buffer or reply).strip()
            if not final:
                final = "(No response from model. Check Ollama and try again.)"
            self.chat.update_message(self._pending_bubble, final)
            self._log_turn(final, error=False)
        self._pending_bubble = None
        self._stream_buffer = ""

    def _on_reply_error(self, message: str) -> None:
        if self._pending_bubble:
            text = f"Error: {message}"
            self.chat.update_message(self._pending_bubble, text)
            self._log_turn(text, error=True)
        self._pending_bubble = None
        self._stream_buffer = ""

    def _cleanup_worker(self, *_args) -> None:
        self.chat.set_input_enabled(True)
        self.controls.set_controls_enabled(True)
        self._worker = None

    def closeEvent(self, event) -> None:
        self._logger.save_settings(self.controls.get_settings_dict())
        super().closeEvent(event)
