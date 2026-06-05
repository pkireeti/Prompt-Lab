"""
PromptLab — AI Teaching Lab
Entry point for the desktop application.
"""

import sys

from PyQt6.QtWidgets import QApplication

from ui.main_window import MainWindow


def main() -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("PromptLab")

    window = MainWindow()
    window.show()

    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
