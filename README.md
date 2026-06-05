# PromptLab — AI Teaching Lab

A PyQt6 desktop app for experimenting with LLM sampling parameters (temperature, top-k, top-p) using local Ollama models.

## Features

- Dropdown to select any locally installed Ollama model
- Adjustable sliders for temperature, top-k, top-p, max tokens, repeat penalty
- Random / fixed seed control
- Streaming responses
- System prompt presets (teacher, professor, programming-only)
- Chat history logging to CSV
- Temperature vs response-length chart generation
- Settings auto-save on close

## Requirements

- **Ollama** — Download from [ollama.com](https://ollama.com)
- **Python 3.10+**

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/pkireeti/Prompt-Lab.git
cd Prompt-Lab

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Pull a model (example)
ollama pull qwen3:1.7b

# 4. Run the app
python main.py
```

## Usage

1. Select a model from the dropdown in the left panel
2. Adjust sampling sliders (temperature, top-k, top-p)
3. Type a message in the chat and press Enter
4. Observe how parameter changes affect responses

## Dependencies

- PyQt6
- requests
- pandas
- numpy
- matplotlib

## Build Executable (optional)

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name PromptLab main.py
```
