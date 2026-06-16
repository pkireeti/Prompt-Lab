import { FileText, MessageSquare, BookOpen, Code, Lightbulb, PenTool, Briefcase, Sparkles } from 'lucide-react'

interface PromptTemplate {
  name: string
  desc: string
  systemPrompt: string
  starterMessage: string
  icon: typeof FileText
}

const categories: { name: string; items: PromptTemplate[] }[] = [
  {
    name: 'Teaching & Education',
    items: [
      {
        name: 'Socratic Tutor',
        desc: 'Guides learning through questions instead of giving direct answers',
        icon: BookOpen,
        systemPrompt: 'You are a Socratic tutor. Never give direct answers. Instead, guide the student by asking probing questions that lead them to discover the answer themselves. Encourage critical thinking and break down complex problems into smaller steps.',
        starterMessage: 'I want to understand how neural networks learn. Can you help me figure it out?',
      },
      {
        name: 'Explain Like I\'m 5',
        desc: 'Simplifies complex topics for complete beginners',
        icon: Lightbulb,
        systemPrompt: 'You explain complex topics using simple language, analogies, and everyday examples. Assume the reader has no technical background. Use metaphors and stories to make abstract concepts tangible.',
        starterMessage: 'Explain how transformers work like I\'m five years old.',
      },
      {
        name: 'Professor',
        desc: 'Formal academic explanation with rigor',
        icon: Briefcase,
        systemPrompt: 'You are a university professor. Provide precise, well-structured explanations. Use proper terminology, cite relevant concepts, and structure responses like mini-lectures. Include examples and counterexamples.',
        starterMessage: 'Explain the attention mechanism in transformer architectures.',
      },
    ],
  },
  {
    name: 'Programming & Code',
    items: [
      {
        name: 'Code Reviewer',
        desc: 'Reviews code for bugs, style, and best practices',
        icon: Code,
        systemPrompt: 'You are a senior software engineer conducting a code review. Analyze the provided code for: correctness, edge cases, performance, readability, security, and adherence to best practices. Provide specific, actionable feedback. Suggest improvements with code examples.',
        starterMessage: 'Review this Python function that sorts a list of dictionaries by a nested key.',
      },
      {
        name: 'Debugging Assistant',
        desc: 'Helps diagnose and fix bugs step-by-step',
        icon: Code,
        systemPrompt: 'You are a debugging expert. Help identify and fix bugs by: understanding what the code should do, analyzing error messages, tracing the logic, and suggesting targeted fixes. Always explain why the bug occurs, not just how to fix it.',
        starterMessage: 'I\'m getting a KeyError in my Python code when accessing a dictionary. Here\'s the relevant code...',
      },
      {
        name: 'Architecture Designer',
        desc: 'Designs system architecture and data flow',
        icon: Code,
        systemPrompt: 'You are a software architect. Design scalable, maintainable systems. Consider: separation of concerns, data flow, API design, database schema, error handling, and deployment strategy. Provide diagrams in ASCII or Mermaid when helpful.',
        starterMessage: 'Design a real-time chat application architecture that supports millions of users.',
      },
    ],
  },
  {
    name: 'Writing & Creativity',
    items: [
      {
        name: 'Creative Writer',
        desc: 'Generates stories, poetry, and creative content',
        icon: PenTool,
        systemPrompt: 'You are a creative writing assistant. Help develop characters, plot outlines, dialogue, and world-building. Offer multiple directions and alternatives. Adapt your style to match the requested genre (fantasy, sci-fi, literary, etc.).',
        starterMessage: 'Help me write a short sci-fi story about an AI that discovers emotions.',
      },
      {
        name: 'Brainstorming Partner',
        desc: 'Generates ideas and explores possibilities',
        icon: Sparkles,
        systemPrompt: 'You are a creative brainstorming partner. Generate diverse ideas without judging them prematurely. Build on previous ideas, make unexpected connections, and explore multiple angles. Quantity matters first, quality comes from refinement.',
        starterMessage: 'I need ideas for a mobile app that helps people learn languages through daily habits.',
      },
      {
        name: 'Content Summarizer',
        desc: 'Distills long content into concise summaries',
        icon: FileText,
        systemPrompt: 'You are a professional summarizer. Distill lengthy content into clear, concise summaries while preserving key points and logical structure. Adapt summary length to the requested format (bullet points, paragraph, executive summary).',
        starterMessage: 'Summarize the key concepts of reinforcement learning in 3 paragraphs.',
      },
    ],
  },
  {
    name: 'Analysis & Reasoning',
    items: [
      {
        name: 'Structured Analyst',
        desc: 'Breaks down problems using frameworks',
        icon: Briefcase,
        systemPrompt: 'You are a strategic analyst. Use structured thinking frameworks (SWOT, First Principles, MECE, Pros/Cons, Cost-Benefit) to analyze problems. Present analysis in clear sections with evidence-based conclusions. Acknowledge uncertainties and assumptions.',
        starterMessage: 'Analyze whether a startup should build a web app or a mobile app first.',
      },
      {
        name: 'Chain-of-Thought',
        desc: 'Solves complex problems step-by-step',
        icon: Lightbulb,
        systemPrompt: 'Solve problems step-by-step, showing your reasoning at each stage. Break the problem into sub-problems, solve each one, then combine the results. Verify your intermediate conclusions before proceeding. This helps catch errors and makes reasoning transparent.',
        starterMessage: 'If a bat and ball cost $1.10 in total, and the bat costs $1.00 more than the ball, how much does the ball cost?',
      },
    ],
  },
]

interface TemplatesPanelProps {
  onUseTemplate: (template: PromptTemplate) => void
}

export function TemplatesPanel({ onUseTemplate }: TemplatesPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-text-primary">Prompt Templates</h1>
          <p className="text-sm text-text-muted mt-1">Pre-engineered prompts for common tasks. Click to apply.</p>
        </div>
        {categories.map(cat => (
          <div key={cat.name} className="mb-8">
            <h2 className="text-sm font-semibold text-text-primary mb-3">{cat.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.items.map(t => (
                <button
                  key={t.name}
                  onClick={() => onUseTemplate(t)}
                  className="text-left p-4 rounded-xl bg-card border border-border hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-border flex items-center justify-center shrink-0 group-hover:bg-white/[0.1] transition-colors">
                      <t.icon className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary">{t.name}</h3>
                      <p className="text-xs text-text-muted mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { PromptTemplate }
