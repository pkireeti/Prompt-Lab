"""
Left panel — LLM parameter controls (Step 4).
"""

from typing import Any

from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QScrollArea,
    QSlider,
    QSpinBox,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from backend.model import GenerationOptions


class ParamSlider(QWidget):
    """Label + slider + live value display."""

    def __init__(
        self,
        name: str,
        minimum: float,
        maximum: float,
        default: float,
        step: float = 1.0,
        decimals: int = 2,
        suffix: str = "",
        parent: QWidget | None = None,
    ):
        super().__init__(parent)
        self._decimals = decimals
        self._suffix = suffix
        self._mult = int(round(1.0 / step)) if step < 1 else 1

        row = QVBoxLayout(self)
        row.setContentsMargins(0, 0, 0, 0)
        row.setSpacing(4)

        header = QHBoxLayout()
        self._name = QLabel(name)
        self._name.setObjectName("fieldLabel")
        self._value = QLabel(self._format_value(default))
        self._value.setObjectName("sliderValue")
        self._value.setAlignment(Qt.AlignmentFlag.AlignRight)
        header.addWidget(self._name)
        header.addWidget(self._value)
        row.addLayout(header)

        self._slider = QSlider(Qt.Orientation.Horizontal)
        self._slider.setObjectName("paramSlider")
        self._slider.setMinimum(int(round(minimum * self._mult)))
        self._slider.setMaximum(int(round(maximum * self._mult)))
        self._slider.setValue(int(round(default * self._mult)))
        self._slider.valueChanged.connect(self._on_change)
        row.addWidget(self._slider)

    def _format_value(self, value: float) -> str:
        if self._decimals == 0:
            return f"{int(round(value))}{self._suffix}"
        return f"{value:.{self._decimals}f}{self._suffix}"

    def _on_change(self, raw: int) -> None:
        self._value.setText(self._format_value(self.value()))

    def value(self) -> float:
        raw = self._slider.value()
        return raw / self._mult if self._mult > 1 else float(raw)

    def int_value(self) -> int:
        return int(round(self.value()))


class ControlsPanel(QFrame):
    """Left sidebar with model info and LLM sampling controls."""

    clear_chat_requested = pyqtSignal()
    system_prompt_changed = pyqtSignal(str)
    model_changed = pyqtSignal(str)

    def __init__(self, parent: QWidget | None = None):
        super().__init__(parent)
        self.setObjectName("controlsPanel")
        self._status_label: QLabel | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(0)

        scroll = QScrollArea()
        scroll.setObjectName("controlsScroll")
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        outer.addWidget(scroll)

        content = QWidget()
        content.setObjectName("controlsContent")
        layout = QVBoxLayout(content)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(14)

        title = QLabel("AI Controls")
        title.setObjectName("panelTitle")
        layout.addWidget(title)

        layout.addWidget(self._field_label("Model"))
        self._model_combo = QComboBox()
        self._model_combo.setObjectName("modelCombo")
        self._model_combo.currentTextChanged.connect(self._on_model_changed)
        layout.addWidget(self._model_combo)

        self._status_label = QLabel("Checking Ollama…")
        self._status_label.setObjectName("statusLabel")
        self._status_label.setWordWrap(True)
        layout.addWidget(self._status_label)

        layout.addWidget(self._section_label("Sampling"))

        self._temperature = ParamSlider(
            "Temperature", 0, 1, 1.0, step=0.1, decimals=2, parent=content
        )
        layout.addWidget(self._temperature)

        self._top_k = ParamSlider(
            "Top-K", 1, 100, 40, step=1, decimals=0, parent=content
        )
        layout.addWidget(self._top_k)

        self._top_p = ParamSlider(
            "Top-P", 0, 1, 0.9, step=0.01, decimals=2, parent=content
        )
        layout.addWidget(self._top_p)

        self._max_tokens = ParamSlider(
            "Max Tokens", 10, 1000, 200, step=1, decimals=0, parent=content
        )
        layout.addWidget(self._max_tokens)

        self._repeat_penalty = ParamSlider(
            "Repeat Penalty", 1, 2, 1.1, step=0.1, decimals=1, parent=content
        )
        layout.addWidget(self._repeat_penalty)

        sampling_hint = QLabel(
            "Same question + fixed seed often gives the same answer.\n"
            "Enable Random seed below to see temperature / Top-K / Top-P effects."
        )
        sampling_hint.setObjectName("placeholderHint")
        sampling_hint.setWordWrap(True)
        layout.addWidget(sampling_hint)

        layout.addWidget(self._section_label("Reproducibility"))

        self._random_seed = QCheckBox("Random seed (vary each reply)")
        self._random_seed.setObjectName("streamCheck")
        self._random_seed.setChecked(True)
        self._random_seed.setToolTip(
            "Checked: Ollama seed=-1, answers change when you move sliders.\n"
            "Unchecked: fixed seed for repeatable experiments."
        )
        self._random_seed.toggled.connect(self._on_random_seed_toggled)
        layout.addWidget(self._random_seed)

        seed_row = QHBoxLayout()
        seed_row.addWidget(self._field_label("Seed"))
        seed_row.addStretch()
        self._seed = QSpinBox()
        self._seed.setObjectName("seedInput")
        self._seed.setRange(0, 2_147_483_647)
        self._seed.setValue(42)
        self._seed.setEnabled(False)
        seed_row.addWidget(self._seed)
        layout.addLayout(seed_row)

        self._active_params = QLabel("")
        self._active_params.setObjectName("placeholderHint")
        self._active_params.setWordWrap(True)
        layout.addWidget(self._active_params)
        self._wire_sampling_updates()

        layout.addWidget(self._section_label("Output"))

        self._stream = QCheckBox("Stream Response")
        self._stream.setObjectName("streamCheck")
        self._stream.setChecked(False)
        self._stream.setToolTip("Show the model's reply token by token as it generates")
        layout.addWidget(self._stream)

        layout.addWidget(self._section_label("System Prompt"))

        preset_row = QHBoxLayout()
        preset_row.setSpacing(8)
        self._preset_teacher = QPushButton("Helpful teacher")
        self._preset_teacher.setObjectName("presetButton")
        self._preset_professor = QPushButton("Strict professor")
        self._preset_professor.setObjectName("presetButton")
        self._preset_programming = QPushButton("Programming only")
        self._preset_programming.setObjectName("presetButton")
        self._preset_teacher.clicked.connect(
            lambda: self._apply_preset(
                "You are a friendly, patient teacher. "
                "Explain clearly and stay helpful and respectful."
            )
        )
        self._preset_professor.clicked.connect(
            lambda: self._apply_preset(
                "You are a formal university professor. "
                "Be precise and direct, but stay professional and calm — never angry or rude."
            )
        )
        self._preset_programming.clicked.connect(
            lambda: self._apply_preset(
                "Answer ONLY programming and coding questions. "
                "For any other topic, respond with exactly: "
                "I only help with programming questions."
            )
        )
        preset_row.addWidget(self._preset_teacher)
        preset_row.addWidget(self._preset_professor)
        layout.addLayout(preset_row)
        layout.addWidget(self._preset_programming)

        self._system_hint = QLabel(
            "Tip: After changing rules, click Clear chat history. "
            "Small models follow rules better with a fresh chat."
        )
        self._system_hint.setObjectName("placeholderHint")
        self._system_hint.setWordWrap(True)
        layout.addWidget(self._system_hint)

        self._system_prompt = QTextEdit()
        self._system_prompt.setObjectName("systemPrompt")
        self._system_prompt.setPlaceholderText(
            "Sets the AI's role and tone for every reply."
        )
        self._system_prompt.setPlainText(
            "You are a friendly, patient teacher. "
            "Explain clearly and stay helpful and respectful."
        )
        self._system_prompt.setMaximumHeight(100)
        self._system_prompt.textChanged.connect(self._emit_system_changed)
        layout.addWidget(self._system_prompt)

        self._clear_chat_btn = QPushButton("Clear chat history")
        self._clear_chat_btn.setObjectName("presetButton")
        self._clear_chat_btn.setToolTip(
            "Reset conversation memory (fixes stuck or angry replies)"
        )
        self._clear_chat_btn.clicked.connect(self.clear_chat_requested.emit)
        layout.addWidget(self._clear_chat_btn)

        layout.addStretch()
        scroll.setWidget(content)

    @staticmethod
    def _field_label(text: str) -> QLabel:
        label = QLabel(text)
        label.setObjectName("fieldLabel")
        return label

    @staticmethod
    def _section_label(text: str) -> QLabel:
        label = QLabel(text)
        label.setObjectName("sectionLabel")
        return label

    def _on_random_seed_toggled(self, enabled: bool) -> None:
        self._seed.setEnabled(not enabled)
        self._update_active_params_label()

    def _wire_sampling_updates(self) -> None:
        for widget in (
            self._temperature,
            self._top_k,
            self._top_p,
            self._max_tokens,
            self._repeat_penalty,
        ):
            widget._slider.valueChanged.connect(self._update_active_params_label)
        self._seed.valueChanged.connect(self._update_active_params_label)
        self._random_seed.toggled.connect(self._update_active_params_label)
        self._update_active_params_label()

    def _update_active_params_label(self) -> None:
        opts = self.get_generation_options()
        seed_text = "random" if opts.random_seed else str(opts.seed)
        model = self.get_selected_model() or "?"
        self._active_params.setText(
            f"Model: {model}  ·  temp={opts.temperature:.2f}, "
            f"top_k={int(opts.top_k)}, top_p={opts.top_p:.2f}, seed={seed_text}"
        )

    def get_generation_options(self) -> GenerationOptions:
        return GenerationOptions(
            temperature=self._temperature.value(),
            top_k=int(self._top_k.int_value()),
            top_p=self._top_p.value(),
            num_predict=self._max_tokens.int_value(),
            repeat_penalty=self._repeat_penalty.value(),
            seed=self._seed.value(),
            random_seed=self._random_seed.isChecked(),
        )

    def get_system_prompt(self) -> str:
        text = self._system_prompt.toPlainText().strip()
        return text or (
            "You are a friendly, patient teacher. "
            "Explain clearly and stay helpful and respectful."
        )

    def _apply_preset(self, text: str) -> None:
        self._system_prompt.setPlainText(text)
        self._emit_system_changed()

    def _emit_system_changed(self) -> None:
        self.system_prompt_changed.emit(self.get_system_prompt())

    def populate_models(self, models: list[str]) -> None:
        current = self._model_combo.currentText()
        self._model_combo.blockSignals(True)
        self._model_combo.clear()
        self._model_combo.addItems(models)
        if current in models:
            self._model_combo.setCurrentText(current)
        self._model_combo.blockSignals(False)

    def get_selected_model(self) -> str:
        return self._model_combo.currentText()

    def set_model(self, name: str) -> None:
        idx = self._model_combo.findText(name)
        if idx >= 0:
            self._model_combo.setCurrentIndex(idx)

    def _on_model_changed(self, name: str) -> None:
        if name:
            self.model_changed.emit(name)
            self._update_active_params_label()

    def is_stream_enabled(self) -> bool:
        return self._stream.isChecked()

    def get_settings_dict(self) -> dict[str, Any]:
        """All UI settings for JSON persistence."""
        opts = self.get_generation_options()
        return {
            "model_name": self.get_selected_model() or "",
            "temperature": opts.temperature,
            "top_k": opts.top_k,
            "top_p": opts.top_p,
            "max_tokens": opts.num_predict,
            "repeat_penalty": opts.repeat_penalty,
            "seed": opts.seed,
            "random_seed": opts.random_seed,
            "stream": self.is_stream_enabled(),
            "system_prompt": self.get_system_prompt(),
        }

    def apply_settings(self, settings: dict[str, Any]) -> None:
        """Restore sliders and prompts from saved settings.json."""
        if "model_name" in settings and settings["model_name"]:
            self.set_model(str(settings["model_name"]))
        if "temperature" in settings:
            self._temperature._slider.setValue(
                int(round(float(settings["temperature"]) * 10))
            )
        if "top_k" in settings:
            self._top_k._slider.setValue(
                int(round(float(settings["top_k"]) * self._top_k._mult))
            )
        if "top_p" in settings:
            self._top_p._slider.setValue(int(round(float(settings["top_p"]) * 100)))
        if "max_tokens" in settings:
            self._max_tokens._slider.setValue(int(settings["max_tokens"]))
        if "repeat_penalty" in settings:
            self._repeat_penalty._slider.setValue(
                int(round(float(settings["repeat_penalty"]) * 10))
            )
        if "seed" in settings:
            self._seed.setValue(int(settings["seed"]))
        if "random_seed" in settings:
            self._random_seed.setChecked(bool(settings["random_seed"]))
        if "stream" in settings:
            self._stream.setChecked(bool(settings["stream"]))
        if "system_prompt" in settings:
            self._system_prompt.setPlainText(str(settings["system_prompt"]))
        self._update_active_params_label()
        self._emit_system_changed()

    def set_controls_enabled(self, enabled: bool) -> None:
        """Disable sliders while a request is in flight."""
        widgets = [
            self._temperature,
            self._top_k,
            self._top_p,
            self._max_tokens,
            self._repeat_penalty,
            self._random_seed,
            self._seed,
            self._stream,
            self._system_prompt,
            self._preset_teacher,
            self._preset_professor,
            self._preset_programming,
            self._model_combo,
            self._clear_chat_btn,
        ]
        for w in widgets:
            w.setEnabled(enabled)

    def set_connection_status(self, connected: bool) -> None:
        if not self._status_label:
            return
        self._status_label.setProperty("connected", connected)
        if connected:
            self._status_label.setText("Status: Ollama connected")
        else:
            self._status_label.setText("Status: Ollama offline")
        self._status_label.style().unpolish(self._status_label)
        self._status_label.style().polish(self._status_label)
