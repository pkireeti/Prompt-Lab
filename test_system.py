"""Quick system-prompt test script."""
from backend.chat_manager import ChatManager
from backend.model import GenerationOptions

RULES = (
    "Answer ONLY programming and coding questions. "
    "For any other topic, respond with exactly: "
    "I only help with programming questions."
)

def ask(chat: ChatManager, q: str) -> str:
    return chat.send_user_message(q, options=GenerationOptions(temperature=0.3, num_predict=100))

def main() -> None:
    chat = ChatManager()
    chat.set_system_prompt(RULES)
    print("NON-PROG:", ask(chat, "What is the capital of France?")[:120])
    chat2 = ChatManager()
    chat2.set_system_prompt(RULES)
    print("PROG:", ask(chat2, "How do I reverse a list in Python?")[:120])

if __name__ == "__main__":
    main()
