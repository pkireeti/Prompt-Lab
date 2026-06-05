"""PromptLab — pure black theme."""

APP_STYLESHEET = """
QMainWindow, QWidget {
    background-color: #000000;
    color: #ffffff;
    font-family: "Segoe UI", sans-serif;
    font-size: 13px;
}

QStatusBar {
    background-color: #0a0a0a;
    color: #888888;
    border-top: 1px solid #1a1a1a;
}

#controlsPanel {
    background-color: #000000;
    border-right: 1px solid #1a1a1a;
    min-width: 280px;
    max-width: 340px;
}

#controlsScroll {
    border: none;
    background: #000000;
}

#controlsContent {
    background: #000000;
}

#sectionLabel {
    color: #ffffff;
    font-size: 12px;
    font-weight: bold;
    padding-top: 4px;
}

#sliderValue {
    color: #ffffff;
    font-size: 12px;
    min-width: 48px;
}

QSlider#paramSlider::groove:horizontal {
    background: #1a1a1a;
    height: 6px;
    border-radius: 3px;
}

QSlider#paramSlider::handle:horizontal {
    background: #ffffff;
    width: 14px;
    height: 14px;
    margin: -4px 0;
    border-radius: 7px;
}

QSlider#paramSlider::sub-page:horizontal {
    background: #333333;
    border-radius: 3px;
}

QSpinBox#seedInput {
    background-color: #0a0a0a;
    border: 1px solid #222222;
    border-radius: 6px;
    padding: 4px 8px;
    color: #ffffff;
    min-width: 80px;
}

QCheckBox#streamCheck {
    color: #ffffff;
    spacing: 8px;
}

QCheckBox#streamCheck::indicator {
    width: 16px;
    height: 16px;
    border: 1px solid #444444;
    border-radius: 4px;
    background: #0a0a0a;
}

QCheckBox#streamCheck::indicator:checked {
    background: #ffffff;
    border-color: #ffffff;
}

QTextEdit#systemPrompt {
    background-color: #0a0a0a;
    border: 1px solid #222222;
    border-radius: 8px;
    padding: 8px;
    color: #ffffff;
    selection-background-color: #333333;
}

QTextEdit#systemPrompt:focus {
    border-color: #444444;
}

QPushButton#presetButton {
    background-color: #111111;
    color: #ffffff;
    border: 1px solid #333333;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 11px;
}

QPushButton#presetButton:hover {
    background-color: #222222;
    border-color: #444444;
}

QPushButton#presetButton:pressed {
    background-color: #333333;
}

QPushButton#presetButton:disabled {
    background-color: #0a0a0a;
    color: #555555;
    border-color: #1a1a1a;
}

#chatPanel {
    background-color: #000000;
}

#panelTitle {
    font-size: 16px;
    font-weight: bold;
    color: #ffffff;
}

#fieldLabel {
    color: #888888;
    font-size: 11px;
}

QComboBox#modelCombo {
    background-color: #0a0a0a;
    border: 1px solid #333333;
    border-radius: 6px;
    padding: 6px 8px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    min-height: 18px;
}

QComboBox#modelCombo:hover {
    border-color: #555555;
}

QComboBox#modelCombo:focus {
    border-color: #777777;
}

QComboBox#modelCombo::drop-down {
    border: none;
    width: 24px;
}

QComboBox#modelCombo::down-arrow {
    image: none;
    border: none;
    width: 0;
}

QComboBox#modelCombo QAbstractItemView {
    background-color: #111111;
    border: 1px solid #333333;
    border-radius: 4px;
    color: #ffffff;
    selection-background-color: #222222;
    selection-color: #ffffff;
    outline: none;
    padding: 4px;
}

#placeholderHint {
    color: #666666;
    font-size: 12px;
}

#statusLabel {
    color: #888888;
    font-size: 12px;
}

#statusLabel[connected="true"] {
    color: #aaaaaa;
}

#statusLabel[connected="false"] {
    color: #888888;
}

#chatScroll {
    border: none;
    background: transparent;
}

#chatContainer {
    background: transparent;
}

QFrame#bubble_user {
    background-color: #111111;
    border: 1px solid #222222;
    border-radius: 10px;
    margin-left: 48px;
}

QFrame#bubble_assistant {
    background-color: #0a0a0a;
    border: 1px solid #1a1a1a;
    border-radius: 10px;
    margin-right: 48px;
}

#bubbleRole {
    font-size: 10px;
    font-weight: bold;
    color: #888888;
}

#bubbleBody {
    color: #ffffff;
    font-size: 13px;
}

#inputBar {
    background-color: #000000;
    border-top: 1px solid #1a1a1a;
}

#promptInput {
    background-color: #0a0a0a;
    border: 1px solid #222222;
    border-radius: 8px;
    padding: 10px 12px;
    color: #ffffff;
    selection-background-color: #333333;
    selection-color: #ffffff;
}

#promptInput:focus {
    border-color: #444444;
}

#sendButton {
    background-color: #ffffff;
    color: #000000;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 600;
}

#sendButton:hover {
    background-color: #cccccc;
}

#sendButton:pressed {
    background-color: #aaaaaa;
}

#sendButton:disabled {
    background-color: #222222;
    color: #666666;
}

QScrollBar:vertical {
    background: #000000;
    width: 10px;
    border-radius: 5px;
}

QScrollBar::handle:vertical {
    background: #222222;
    border-radius: 5px;
    min-height: 24px;
}

QScrollBar::handle:vertical:hover {
    background: #333333;
}
"""
