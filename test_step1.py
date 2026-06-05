"""
Step 1 smoke test — run from PromptLab folder:

    python test_step1.py

Requires Ollama running with: ollama pull qwen3:1.7b
"""

from backend.model import GenerationOptions, OllamaModel
from backend.chat_manager import ChatManager


def main() -> None:
    model = OllamaModel()

    print("=== PromptLab Backend Test ===\n")

    if not model.is_server_running():
        print("ERROR: Ollama is not running.")
        print("Start it, then run: ollama pull qwen3:1.7b")
        return

    if not model.is_model_available():
        print("WARNING: qwen3:1.7b not found. Run: ollama pull qwen3:1.7b")
        return

    print("Ollama OK | Model qwen3:1.7b found\n")

    opts = GenerationOptions(temperature=1.0, seed=42)
    chat = ChatManager(model=model)
    chat.set_system_prompt("You are a helpful teacher. Reply in one short sentence.")

    print("User: What is temperature in LLMs?")
    reply = chat.send_user_message(
        "What is temperature in LLMs?",
        options=opts,
        stream=False,
    )
    print(f"Assistant: {reply}\n")

    print("--- Streaming test ---")
    chat2 = ChatManager(model=model)
    chat2.set_system_prompt("You are a helpful teacher.")
    stream_gen = chat2.send_user_message(
        "Say hello in three words.",
        options=opts,
        stream=True,
    )
    parts = []
    for token in stream_gen:
        parts.append(token)
    full = "".join(parts)
    chat2.finalize_streamed_reply(full)
    safe = full.encode("ascii", errors="replace").decode()
    print(f"Streaming: {safe}\n")


if __name__ == "__main__":
    main()
