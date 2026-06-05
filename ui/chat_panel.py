"""
Right panel — chat conversation view.
"""

from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QScrollArea,
    QSizePolicy,
    QVBoxLayout,
    QWidget,
)


class ChatBubble(QFrame):
    """Single message bubble for user or assistant."""

    def __init__(self, role: str, text: str, parent: QWidget | None = None):
        super().__init__(parent)
        self.setObjectName(f"bubble_{role}")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(12, 8, 12, 8)

        role_label = QLabel("You" if role == "user" else "Assistant")
        role_label.setObjectName("bubbleRole")
        layout.addWidget(role_label)

        self._body = QLabel(text)
        self._body.setObjectName("bubbleBody")
        self._body.setWordWrap(True)
        self._body.setTextInteractionFlags(
            Qt.TextInteractionFlag.TextSelectableByMouse
        )
        layout.addWidget(self._body)

    def set_text(self, text: str) -> None:
        self._body.setText(text)

    def append_text(self, text: str) -> None:
        self._body.setText(self._body.text() + text)


class ChatPanel(QFrame):
    """Scrollable chat history with prompt input and send button."""

    message_sent = pyqtSignal(str)

    def __init__(self, parent: QWidget | None = None):
        super().__init__(parent)
        self.setObjectName("chatPanel")
        self._build_ui()

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        header = QLabel("Chat")
        header.setObjectName("panelTitle")
        header.setContentsMargins(16, 12, 16, 8)
        root.addWidget(header)

        self._scroll = QScrollArea()
        self._scroll.setObjectName("chatScroll")
        self._scroll.setWidgetResizable(True)
        self._scroll.setHorizontalScrollBarPolicy(
            Qt.ScrollBarPolicy.ScrollBarAlwaysOff
        )

        self._chat_container = QWidget()
        self._chat_container.setObjectName("chatContainer")
        self._chat_layout = QVBoxLayout(self._chat_container)
        self._chat_layout.setContentsMargins(16, 8, 16, 16)
        self._chat_layout.setSpacing(10)
        self._chat_layout.addStretch()

        self._scroll.setWidget(self._chat_container)
        root.addWidget(self._scroll, stretch=1)

        input_bar = QFrame()
        input_bar.setObjectName("inputBar")
        input_row = QHBoxLayout(input_bar)
        input_row.setContentsMargins(16, 12, 16, 16)
        input_row.setSpacing(10)

        self._input = QLineEdit()
        self._input.setObjectName("promptInput")
        self._input.setPlaceholderText("Type a message… (Enter to send)")
        self._input.returnPressed.connect(self._on_send)
        input_row.addWidget(self._input, stretch=1)

        self._send_btn = QPushButton("Send")
        self._send_btn.setObjectName("sendButton")
        self._send_btn.clicked.connect(self._on_send)
        input_row.addWidget(self._send_btn)

        root.addWidget(input_bar)

    def show_welcome(self, text: str) -> None:
        self.clear_chat()
        self.append_message("assistant", text)

    def _on_send(self) -> None:
        text = self._input.text().strip()
        if not text:
            return
        self._input.clear()
        self.append_message("user", text)
        self.message_sent.emit(text)

    def append_message(self, role: str, text: str) -> ChatBubble:
        """Add a user or assistant bubble and scroll to the bottom."""
        bubble = ChatBubble(role, text)
        bubble.setSizePolicy(
            QSizePolicy.Policy.Preferred,
            QSizePolicy.Policy.Maximum,
        )
        index = self._chat_layout.count() - 1
        self._chat_layout.insertWidget(index, bubble)
        self._scroll_to_bottom()
        return bubble

    def begin_assistant_message(self, text: str = "Thinking…") -> ChatBubble:
        """Placeholder assistant bubble while waiting for Ollama."""
        return self.append_message("assistant", text)

    def update_message(self, bubble: ChatBubble, text: str) -> None:
        bubble.set_text(text)
        self._scroll_to_bottom()

    def append_to_message(self, bubble: ChatBubble, text: str) -> None:
        bubble.append_text(text)
        self._scroll_to_bottom()

    def _scroll_to_bottom(self) -> None:
        bar = self._scroll.verticalScrollBar()
        bar.setValue(bar.maximum())

    def clear_chat(self) -> None:
        while self._chat_layout.count() > 1:
            item = self._chat_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

    def set_input_enabled(self, enabled: bool) -> None:
        self._input.setEnabled(enabled)
        self._send_btn.setEnabled(enabled)
