import { motion, AnimatePresence } from 'framer-motion'
import {
  X, BookOpen, Thermometer, Target, Layers, Hash, FileText, Repeat,
  ArrowLeftRight, MessageSquare, Key, Globe, Sliders, Lightbulb,
} from 'lucide-react'

interface DocsDialogProps {
  open: boolean
  onClose: () => void
}

const sections = [
  {
    icon: BookOpen,
    title: 'What is PromptLab?',
    content: `
      PromptLab is an interactive teaching lab for understanding how Large Language Models (LLMs) work under the hood.
      It bridges the gap between using an AI chat interface and understanding the sampling mechanics that shape every response.

      Instead of treating the model as a black box, PromptLab exposes the core parameters that control generation —
      temperature, Top-P, Top-K, repeat penalty, and seed — and lets you tweak them in real-time while chatting.
      Every parameter change directly affects how the model selects the next token.

      You can run the same prompt at multiple settings side-by-side, save experiments, and build an intuition for
      how these knobs influence creativity, coherence, and determinism. PromptLab supports both local models
      (via Ollama) and cloud APIs (OpenAI, Groq, NVIDIA, etc.) for flexible experimentation.
    `,
  },
  {
    icon: Lightbulb,
    title: 'Prompt Engineering Basics',
    content: `
      Prompt engineering is the practice of designing inputs to get reliable, useful outputs from LLMs.
      It is both an art and a science — small wording changes can produce dramatically different results.

      Core principles:
      • Be specific and direct — "Write a 3-paragraph summary of photosynthesis for a 5th grader" beats "Explain plants"
      • Provide context — Give the model background information before asking it to act
      • Use personas — "You are an expert physicist explaining quantum entanglement" frames the response style
      • Chain reasoning — Ask the model to think step-by-step for complex problems
      • Set constraints — Explicitly define length, format, tone, and what to avoid
      • Iterate — Prompt engineering is rarely one-shot; refine based on outputs

      PromptLab's System Prompt feature lets you set persistent instructions that apply to every message in a session,
      making it easy to experiment with different personas and constraints.
    `,
  },
  {
    icon: Thermometer,
    title: 'Temperature — The Creativity Dial',
    content: `
      Temperature controls the randomness of token selection. It directly scales the log probabilities
      before the model applies softmax to choose the next token.

      • 0.0 – 0.2: Nearly deterministic. The model always picks the highest-probability token.
        Best for factual Q&A, code generation, math, and data extraction.
      • 0.3 – 0.5: Mild randomness. Slight variation while staying grounded.
        Good for summarization, translation, and structured writing.
      • 0.6 – 0.8: Balanced creativity. The model explores alternatives.
        Ideal for general conversation, explanations, and content drafting.
      • 0.9 – 1.0: High creativity. Unusual word choices and unexpected directions.
        Great for brainstorming, creative writing, and poetry.

      At temperature 0, the model is fully deterministic — same input always produces the same output.
      As temperature increases, lower-probability tokens become more likely, making each response unique.
      Values above 1.0 can lead to incoherent or hallucinated outputs.
    `,
  },
  {
    icon: Target,
    title: 'Top-P (Nucleus Sampling)',
    content: `
      Top-P, also called nucleus sampling, selects from the smallest set of tokens whose cumulative
      probability exceeds P. Unlike Top-K which takes a fixed number of tokens, Top-P adapts dynamically
      based on the probability distribution.

      • 0.1: Very focused — only considers the most likely tokens (≈ deterministic)
      • 0.5: Balanced — cuts off the long tail of unlikely tokens
      • 0.9: Inclusive — considers most plausible tokens (default for many models)
      • 1.0: Considers all tokens, effectively disabled

      How it works: If the top 5 tokens have probabilities [0.4, 0.3, 0.15, 0.1, 0.05] and P=0.8,
      the model selects from only the first 3 tokens (cumulative probability = 0.85).
      The fourth token (0.1) is excluded even though Top-K=5 would include it.

      Tip: Use Top-P together with temperature. Temperature shapes the probability distribution first,
      then Top-P decides how many tokens to sample from. A common combo is temp 0.7 + Top-P 0.9.
    `,
  },
  {
    icon: Layers,
    title: 'Top-K — Fixed-Width Sampling',
    content: `
      Top-K restricts the model to only consider the K most likely next tokens.
      All other tokens are assigned zero probability regardless of their actual likelihood.

      • 1: Greedy decoding — always picks the single most likely token (same as temp 0)
      • 10: Very restrictive — only top 10 candidates, clean but repetitive
      • 40: Default — good balance for most use cases
      • 100: Nearly all tokens considered, high diversity

      Top-K is a simpler, older technique than Top-P. It works well but has a downside:
      when the model is very confident (one token has 90% probability), Top-K=40 still forces
      40 candidates; when uncertain (many tokens have similar probability), Top-K=40 may cut off
      valid options. Modern sampling often uses Top-P instead, or combines both.

      PromptLab lets you set both Top-K and Top-P simultaneously — the model applies Top-K first,
      then Top-P on the remaining candidates.
    `,
  },
  {
    icon: Hash,
    title: 'Seed — Reproducibility',
    content: `
      The seed initializes the random number generator used during sampling.
      When you set a fixed seed with identical parameters, the model produces the exact same output
      every time. This is essential for:

      • Scientific experiments — isolate the effect of parameter changes
      • Debugging — reproduce issues consistently
      • Demonstrations — show reproducible examples
      • A/B testing — compare outputs fairly

      When "random seed" is enabled, the model uses a different random seed each time,
      ensuring varied responses even with identical parameters.

      Note: Seeds only guarantee reproducibility within the same model version. Different model
      quantizations or updated weights will produce different results with the same seed.
    `,
  },
  {
    icon: Repeat,
    title: 'Repeat Penalty',
    content: `
      Repeat penalty discourages the model from repeating tokens it has already generated.
      It works by reducing the probability of tokens that have appeared in the recent context.

      • 1.0: No penalty — the model may repeat words, phrases, or whole sentences
      • 1.1: Mild penalty — reduces repetition without affecting coherence (default)
      • 1.2 – 1.3: Moderate — noticeable reduction in repetition
      • 1.5+: Aggressive — can produce unusual or fragmented text

      Repeat penalty is especially important for small models (like the 1-3B parameter models
      available locally) which are more prone to repeating themselves. Larger models (7B+)
      typically handle repetition better and need less penalty.

      The penalty applies to recent tokens in the context, not the entire history.
      This means the model can reuse tokens from earlier in the conversation without penalty.
    `,
  },
  {
    icon: FileText,
    title: 'System Prompts — Setting the Stage',
    content: `
      The system prompt is a persistent instruction that defines the model's behavior, persona,
      and constraints for the entire session. It acts as the "constitution" the model follows
      when generating every response. Unlike user messages which are per-turn, the system prompt
      is always present in the context window.

      Effective system prompt strategies:
      • Role definition — "You are a physics professor at MIT specializing in quantum mechanics"
      • Format specification — "Respond in bullet points with a summary at the end"
      • Tone guidance — "Use simple language suitable for a 10-year-old"
      • Constraint setting — "Never mention specific prices or brands"
      • Knowledge boundaries — "Only answer questions about computer science"

      PromptLab includes preset system prompts (Teacher, Professor, Code) and lets you write
      custom ones. The system prompt is preserved across new sessions via the Parameter Panel.

      A well-crafted system prompt often matters more than the sampling parameters.
      Spending time on your system prompt is the highest-leverage prompt engineering activity.
    `,
  },
  {
    icon: ArrowLeftRight,
    title: 'Comparison Mode — Side-by-Side Experiments',
    content: `
      The Compare feature runs your prompt at multiple temperature settings simultaneously
      and displays the results side-by-side. This makes the effect of temperature immediately
      visible and is the fastest way to build intuition.

      How to use:
      1. Start a conversation and send a message
      2. Click the "Compare" button above the chat input
      3. Select temperature values to test (e.g., 0.2, 0.7, 1.2)
      4. Review the outputs side-by-side with analytics

      Each comparison run records: tokens used, response time, generation speed, and model name.
      This quantitative data helps you understand not just quality differences but also performance
      trade-offs at different settings.
    `,
  },
  {
    icon: Globe,
    title: 'API Integration — Using Cloud Models',
    content: `
      PromptLab supports OpenAI-compatible APIs alongside local Ollama models.
      This lets you experiment with the same parameters across different model providers.

      Supported providers (auto-detected from your API key):
      • OpenAI (sk-...) — GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-turbo
      • Groq (gsk_...) — Llama 3, Mixtral, Gemma — free tier available
      • NVIDIA (nvapi-...) — Llama 3.1 Nemotron, Yi-Large
      • Perplexity (pplx-...) — Sonar, Llama 3 models

      When connected via API, the model selector in the header shows the available models
      from your provider. The parameter panel, comparison mode, and system prompts all work
      the same way regardless of whether you're using local or cloud models.

      To connect, paste your API key in the sidebar under the API section.
      The app auto-detects your provider and fetches available models.
      You can also configure a custom base URL for other OpenAI-compatible endpoints.
    `,
  },
  {
    icon: Sliders,
    title: 'Parameters Quick Reference',
    content: `
      Parameter          | Range       | Default | Effect
      Temperature        | 0.0 – 1.0   | 0.7     | Controls randomness
      Top-P             | 0.0 – 1.0   | 0.9     | Nucleus sampling threshold
      Top-K             | 1 – 100     | 40      | Limits candidate tokens
      Max Tokens        | 16 – 4096   | 512     | Maximum response length
      Repeat Penalty    | 1.0 – 2.0   | 1.1     | Penalizes token repetition
      Seed              | 0 – 999999  | 42      | RNG seed for reproducibility

      Recommended combinations:
      • Precise/factual: temp 0.1, Top-P 0.5, Top-K 10
      • Balanced: temp 0.7, Top-P 0.9, Top-K 40
      • Creative: temp 0.9, Top-P 0.95, Top-K 60
      • Exploratory: temp 1.0, Top-P 1.0, Top-K 100
    `,
  },
]

export function DocsDialog({ open, onClose }: DocsDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-background border border-border rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-border flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-text-secondary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Documentation</h2>
                  <p className="text-xs text-text-muted">PromptLab guide &amp; prompt engineering</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {sections.map(s => (
                <div key={s.title} className="p-4 rounded-xl bg-card border border-border hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <s.icon className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary mb-1">{s.title}</h3>
                      <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{s.content.trim()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
