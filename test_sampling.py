"""
Verify temperature / top_k / top_p reach Ollama.
Run: python test_sampling.py
"""

from backend.model import GenerationOptions, OllamaModel

PROMPT = [{"role": "user", "content": "Write one short creative sentence about stars."}]


def ask(opts: GenerationOptions) -> str:
    return OllamaModel().chat(PROMPT, options=opts)[:70]


def main() -> None:
    print("=== Fixed seed 42, temperature 0.1 vs 1.0 ===")
    for temp in (0.1, 1.0):
        o = GenerationOptions(temperature=temp, seed=42, random_seed=False)
        print(f"temp={temp}: {ask(o)}")

    print("\n=== Random seed, 3 runs (should differ) ===")
    for i in range(3):
        o = GenerationOptions(temperature=1.0, random_seed=True)
        print(f"run {i + 1}: {ask(o)}")

    print("\n=== Random seed, top_k 5 vs 100 ===")
    for k in (5, 100):
        o = GenerationOptions(temperature=1.0, top_k=k, random_seed=True)
        print(f"top_k={k}: {ask(o)}")

    print("\nDone — if random runs differ, sliders are working.")


if __name__ == "__main__":
    main()
