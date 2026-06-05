"""
Session logging — CSV history, JSON export, settings, experiment charts.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from .model import GenerationOptions

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"
GRAPHS_DIR = BASE_DIR / "graphs"

CHAT_CSV = DATA_DIR / "chat_history.csv"
SETTINGS_JSON = DATA_DIR / "settings.json"


class SessionLogger:
    """Persist chat turns, settings, and teaching experiment graphs."""

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
        """Append one user/assistant turn to data/chat_history.csv."""
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
            "random_seed": options.random_seed,
            "stream": stream,
            "system_prompt": system_prompt[:300],
            "response_length": len(assistant_message),
            "error": error,
            "duration_ms": duration_ms or "",
        }
        df = pd.DataFrame([row])
        write_header = not CHAT_CSV.exists()
        df.to_csv(CHAT_CSV, mode="a", header=write_header, index=False)

    def load_history(self) -> pd.DataFrame:
        if not CHAT_CSV.exists():
            return pd.DataFrame()
        return pd.read_csv(CHAT_CSV)

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
        """Export full chat log + settings to logs/session_<timestamp>.json."""
        settings = self.load_settings() or {}
        model_name = settings.get("model_name", "unknown")
        payload = {
            "exported_at": datetime.now().isoformat(timespec="seconds"),
            "model": model_name,
            "settings": settings,
            "history": self.load_history().to_dict(orient="records"),
        }
        filename = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        path = LOGS_DIR / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        return path

    def plot_temperature_chart(self) -> Optional[Path]:
        """
        Save a chart: temperature vs response length (teaching demo).
        Returns path to PNG or None if not enough data.
        """
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        df = self.load_history()
        if df.empty or "temperature" not in df.columns:
            return None

        if "error" in df.columns:
            clean = df[~df["error"].fillna(False).astype(bool)].copy()
        else:
            clean = df.copy()
        if clean.empty or len(clean) < 2:
            return None

        clean["temperature"] = pd.to_numeric(clean["temperature"], errors="coerce")
        clean["response_length"] = pd.to_numeric(
            clean["response_length"], errors="coerce"
        )
        clean = clean.dropna(subset=["temperature", "response_length"])
        if len(clean) < 2:
            return None

        fig, ax = plt.subplots(figsize=(8, 4.5))
        ax.scatter(
            clean["temperature"],
            clean["response_length"],
            c="#ffffff",
            edgecolors="#666666",
            alpha=0.85,
            s=50,
        )
        ax.set_xlabel("Temperature")
        ax.set_ylabel("Response length (characters)")
        ax.set_title("PromptLab — Temperature vs response length")
        ax.set_facecolor("#0a0a0a")
        fig.patch.set_facecolor("#000000")
        ax.tick_params(colors="#cccccc")
        ax.xaxis.label.set_color("#cccccc")
        ax.yaxis.label.set_color("#cccccc")
        ax.title.set_color("#ffffff")
        for spine in ax.spines.values():
            spine.set_color("#333333")
        ax.grid(True, color="#222222", linestyle="--", alpha=0.6)
        fig.tight_layout()

        path = GRAPHS_DIR / "temperature_vs_response_length.png"
        fig.savefig(path, dpi=120)
        plt.close(fig)
        return path

    @staticmethod
    def data_folder() -> Path:
        return DATA_DIR

    @staticmethod
    def logs_folder() -> Path:
        return LOGS_DIR

    @staticmethod
    def graphs_folder() -> Path:
        return GRAPHS_DIR
