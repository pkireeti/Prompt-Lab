from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from .model import GenerationOptions

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"
GRAPHS_DIR = BASE_DIR / "graphs"

CHAT_CSV = DATA_DIR / "chat_history.csv"
SETTINGS_JSON = DATA_DIR / "settings.json"


class SessionLogger:
    def __init__(self) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

    def log_exchange(
        self,
        user_message: str,
        assistant_message: str,
        options: GenerationOptions,
        system_prompt: str,
        stream: bool,
        error: bool = False,
        duration_ms: Optional[int] = None,
    ) -> None:
        seed_value = -1 if options.random_seed else options.seed
        row = {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "user_message": user_message,
            "assistant_message": assistant_message,
            "temperature": options.temperature,
            "top_k": options.top_k,
            "top_p": options.top_p,
            "max_tokens": options.num_predict,
            "repeat_penalty": options.repeat_penalty,
            "seed": seed_value,
            "random_seed": str(options.random_seed),
            "stream": str(stream),
            "system_prompt": system_prompt[:300],
            "response_length": len(assistant_message),
            "error": str(error),
            "duration_ms": str(duration_ms or ""),
        }
        write_header = not CHAT_CSV.exists()
        with open(CHAT_CSV, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(row.keys()))
            if write_header:
                writer.writeheader()
            writer.writerow(row)

    def load_history(self) -> list[dict[str, Any]]:
        if not CHAT_CSV.exists():
            return []
        with open(CHAT_CSV, newline="", encoding="utf-8") as f:
            return list(csv.DictReader(f))

    def load_settings(self) -> Optional[dict[str, Any]]:
        if not SETTINGS_JSON.exists():
            return None
        try:
            with open(SETTINGS_JSON, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None

    def save_settings(self, settings: dict[str, Any]) -> None:
        settings["saved_at"] = datetime.now().isoformat(timespec="seconds")
        with open(SETTINGS_JSON, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)

    def export_session_json(self) -> Path:
        settings = self.load_settings() or {}
        model_name = settings.get("model_name", "unknown")
        payload = {
            "exported_at": datetime.now().isoformat(timespec="seconds"),
            "model": model_name,
            "settings": settings,
            "history": self.load_history(),
        }
        filename = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        path = LOGS_DIR / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        return path

    def plot_temperature_chart(self) -> Optional[Path]:
        return None

    @staticmethod
    def data_folder() -> Path:
        return DATA_DIR

    @staticmethod
    def logs_folder() -> Path:
        return LOGS_DIR

    @staticmethod
    def graphs_folder() -> Path:
        return GRAPHS_DIR
