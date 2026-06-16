# PromptLab — AI Teaching Lab

A web-based interactive lab for experimenting with LLM sampling parameters (temperature, top-k, top-p) using local Ollama models and cloud APIs (NVIDIA, OpenAI, Groq).

## Features

- Three-mode toggle: Local (Ollama) | NVIDIA (free) | API (your own key)
- Adjustable sliders for temperature, top-k, top-p, max tokens, repeat penalty, seed
- Streaming responses with real-time analytics (tokens, latency, speed)
- Side-by-side comparison mode with configurable parameters per slot
- System prompt presets and custom prompt templates
- Chat history logging
- Dark-mode UI inspired by ChatGPT / Claude / Linear

## Quick Start (Web App)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Install frontend deps & build
cd web_app/frontend
npm install
npm run build
cd ../..

# 3. Run the server
python -m uvicorn web_app.main:app --host 0.0.0.0 --port 8000

# 4. Open http://localhost:8000
```

## Requirements

- **Ollama** (optional, for local models) — [ollama.com](https://ollama.com)
- **Python 3.10+**
- **Node.js 18+** (for frontend build)

## Docker

```bash
docker compose up
```
