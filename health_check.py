"""
PromptLab full health check.
Run: python health_check.py
"""

import sys


def safe_print(text: str) -> None:
    print(text.encode("ascii", errors="replace").decode())


def main() -> int:
    safe_print("=== PromptLab Health Check ===\n")
    failed = []

    # 1. Imports
    try:
        from backend.model import OllamaModel, GenerationOptions
        from backend.chat_manager import ChatManager
        from backend.session_logger import SessionLogger
        from ui.main_window import MainWindow
        safe_print("[OK] All modules import")
    except Exception as e:
        safe_print(f"[FAIL] Imports: {e}")
        return 1

    # 2. Dependencies
    for pkg in ("PyQt6", "requests", "pandas", "numpy", "matplotlib"):
        try:
            __import__(pkg)
            safe_print(f"[OK] Package {pkg}")
        except ImportError:
            safe_print(f"[FAIL] Missing package: {pkg}")
            failed.append(pkg)

    # 3. Ollama
    model = OllamaModel()
    if not model.is_server_running():
        safe_print("[FAIL] Ollama not running")
        failed.append("ollama_server")
    else:
        safe_print("[OK] Ollama server")

    if not model.is_model_available():
        safe_print("[FAIL] qwen3:1.7b not found (run: ollama pull qwen3:1.7b)")
        failed.append("qwen3_model")
    else:
        safe_print("[OK] Model qwen3:1.7b")

    if "ollama_server" in failed or "qwen3_model" in failed:
        safe_print("\nFix Ollama before chat tests.")
        return 1

    # 4. Chat + think=false
    try:
        chat = ChatManager(model=model)
        chat.set_system_prompt("Reply in one short sentence.")
        reply = chat.send_user_message(
            "Say hi.",
            options=GenerationOptions(num_predict=30, temperature=0.5),
        )
        if not reply.strip():
            raise RuntimeError("Empty response")
        safe_print(f"[OK] Chat reply ({len(reply)} chars)")
    except Exception as e:
        safe_print(f"[FAIL] Chat: {e}")
        failed.append("chat")

    # 5. Streaming
    try:
        chat2 = ChatManager(model=model)
        gen = chat2.send_user_message(
            "Say hello.",
            options=GenerationOptions(num_predict=20),
            stream=True,
        )
        text = "".join(gen)
        chat2.finalize_streamed_reply(text)
        if not text.strip():
            raise RuntimeError("Empty stream")
        safe_print(f"[OK] Streaming ({len(text)} chars)")
    except Exception as e:
        safe_print(f"[FAIL] Streaming: {e}")
        failed.append("streaming")

    # 6. System prompt (programming only)
    try:
        rules = (
            "Answer ONLY programming and coding questions. "
            "For any other topic, respond with exactly: "
            "I only help with programming questions."
        )
        c = ChatManager(model=model)
        c.set_system_prompt(rules)
        off = c.send_user_message(
            "What is the capital of France?",
            options=GenerationOptions(num_predict=60, temperature=0.3),
        )
        on = ChatManager(model=model)
        on.set_system_prompt(rules)
        prog = on.send_user_message(
            "How do I reverse a list in Python?",
            options=GenerationOptions(num_predict=80, temperature=0.3),
        )
        if "only help with programming" not in off.lower():
            raise RuntimeError("Off-topic not refused")
        if len(prog) < 20:
            raise RuntimeError("Programming question not answered")
        safe_print("[OK] System prompt (programming filter)")
    except Exception as e:
        safe_print(f"[WARN] System prompt: {e}")

    # 7. Sampling options
    try:
        opts = GenerationOptions(temperature=1.0, top_k=40, top_p=0.9, random_seed=True)
        payload = opts.to_ollama_options()
        assert isinstance(payload["top_k"], int)
        assert payload["seed"] == -1
        safe_print("[OK] Sampling options (top_k int, random seed)")
    except Exception as e:
        safe_print(f"[FAIL] Options: {e}")
        failed.append("options")

    # 8. Logger
    try:
        log = SessionLogger()
        log.log_exchange("u", "a", opts, "sys", False)
        df = log.load_history()
        assert len(df) >= 1
        safe_print(f"[OK] Session logger ({len(df)} rows in CSV)")
    except Exception as e:
        safe_print(f"[FAIL] Logger: {e}")
        failed.append("logger")

    # 9. Data files
    from backend.session_logger import DATA_DIR, LOGS_DIR, GRAPHS_DIR

    for folder in (DATA_DIR, LOGS_DIR, GRAPHS_DIR):
        if folder.exists():
            safe_print(f"[OK] Folder {folder.name}/")
        else:
            safe_print(f"[WARN] Missing folder {folder}")

    safe_print("\n=== Summary ===")
    if failed:
        safe_print(f"Failed: {', '.join(failed)}")
        return 1
    safe_print("All checks passed. Run: python main.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
