"""
Dialog to view session logs and export data (Step 6).
"""

from pathlib import Path

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QDialog,
    QHBoxLayout,
    QLabel,
    QMessageBox,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
)

from backend.session_logger import SessionLogger


class LogsDialog(QDialog):
    """Shows recent chat log rows and export actions."""

    def __init__(self, logger: SessionLogger, parent=None):
        super().__init__(parent)
        self._logger = logger
        self.setWindowTitle("PromptLab — Session Logs")
        self.resize(720, 420)
        self.setStyleSheet(
            "QDialog { background-color: #000000; color: #ffffff; }"
            "QLabel { color: #aaaaaa; }"
            "QTableWidget { background-color: #0a0a0a; color: #ffffff; "
            "gridline-color: #222222; border: 1px solid #222222; }"
            "QHeaderView::section { background-color: #111111; color: #ffffff; "
            "padding: 6px; border: 1px solid #222222; }"
            "QPushButton { background-color: #ffffff; color: #000000; "
            "border-radius: 6px; padding: 8px 14px; font-weight: 600; }"
            "QPushButton:hover { background-color: #cccccc; }"
        )
        self._build_ui()
        self._refresh_table()

    def _build_ui(self) -> None:
        layout = QVBoxLayout(self)

        self._info = QLabel("")
        self._info.setWordWrap(True)
        layout.addWidget(self._info)

        self._table = QTableWidget()
        self._table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self._table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self._table.verticalHeader().setVisible(False)
        layout.addWidget(self._table)

        row = QHBoxLayout()
        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self._refresh_table)
        export_btn = QPushButton("Export JSON")
        export_btn.clicked.connect(self._export_json)
        chart_btn = QPushButton("Generate chart")
        chart_btn.clicked.connect(self._generate_chart)
        folder_btn = QPushButton("Open data folder")
        folder_btn.clicked.connect(self._open_data_folder)
        row.addWidget(refresh_btn)
        row.addWidget(export_btn)
        row.addWidget(chart_btn)
        row.addWidget(folder_btn)
        row.addStretch()
        layout.addLayout(row)

    def _refresh_table(self) -> None:
        df = self._logger.load_history()
        if df.empty:
            self._info.setText(
                f"No log entries yet. CSV path:\n{SessionLogger.data_folder() / 'chat_history.csv'}"
            )
            self._table.setRowCount(0)
            self._table.setColumnCount(0)
            return

        show_cols = [
            c
            for c in [
                "timestamp",
                "temperature",
                "top_k",
                "top_p",
                "seed",
                "response_length",
                "user_message",
            ]
            if c in df.columns
        ]
        view = df[show_cols].tail(50).iloc[::-1]

        self._info.setText(
            f"{len(df)} total entries · showing last {len(view)} · "
            f"{SessionLogger.data_folder() / 'chat_history.csv'}"
        )

        self._table.setRowCount(len(view))
        self._table.setColumnCount(len(show_cols))
        self._table.setHorizontalHeaderLabels(show_cols)

        for r in range(len(view)):
            for c, col in enumerate(show_cols):
                val = str(view.iloc[r][col])
                if col in ("user_message",) and len(val) > 80:
                    val = val[:77] + "..."
                item = QTableWidgetItem(val)
                item.setToolTip(str(view.iloc[r][col]))
                self._table.setItem(r, c, item)

        self._table.resizeColumnsToContents()

    def _export_json(self) -> None:
        path = self._logger.export_session_json()
        QMessageBox.information(
            self,
            "Exported",
            f"Session saved to:\n{path}",
        )

    def _generate_chart(self) -> None:
        path = self._logger.plot_temperature_chart()
        if not path:
            QMessageBox.warning(
                self,
                "Not enough data",
                "Need at least 2 successful replies in the log "
                "with different temperatures.\n\n"
                "Try: enable Random seed, vary temperature, "
                "send a few creative prompts, then generate again.",
            )
            return
        QMessageBox.information(
            self,
            "Chart saved",
            f"Graph saved to:\n{path}",
        )
        self._open_path(path.parent)

    def _open_data_folder(self) -> None:
        self._open_path(SessionLogger.data_folder())

    @staticmethod
    def _open_path(path: Path) -> None:
        import os
        import subprocess
        import sys

        path = Path(path)
        if sys.platform == "win32":
            os.startfile(path)  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            subprocess.run(["open", str(path)], check=False)
        else:
            subprocess.run(["xdg-open", str(path)], check=False)
