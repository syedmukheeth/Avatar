// Sample marketplace for demo mode. Every creator here is fictional.

import type { VoiceHint } from "@/lib/demo/voices"

export type KnowledgeSnippet = {
  id: string
  source: string
  text: string
  /** Extra match terms beyond the words in `text`. */
  keywords?: string[]
}

export type DemoCharacter = {
  id: string
  slug: string
  name: string
  creatorName: string
  profession: string
  tagline: string
  description: string
  /** Accent hue (oklch) for the avatar and voice orb. */
  hue: number
  topics: string[]
  greeting: string
  suggested: string[]
  knowledge: KnowledgeSnippet[]
  conversations: number
  voiceReady: boolean
  /** Fallback browser voice when the server has no model key. */
  voice: VoiceHint
  /** Gemini prebuilt voice and delivery note used for real speech. */
  speech: { voice: string; style: string }
}

export const DEMO_CHARACTERS: DemoCharacter[] = [
  {
    id: "c-maya",
    slug: "coach-maya",
    name: "Coach Maya",
    creatorName: "Maya Rao",
    profession: "Strength & mobility coach",
    tagline: "Get strong without living in the gym.",
    description:
      "Maya has coached over 2,000 beginners through their first year of training. Her AI answers from her programs, nutrition guides and recovery notes: practical, encouraging and never extreme.",
    hue: 25,
    topics: ["beginner training", "protein and nutrition", "recovery", "home workouts"],
    greeting:
      "Hey! I'm Coach Maya's AI. Ask me about starting a routine, eating for strength, or recovering between sessions.",
    suggested: [
      "How often should a beginner train?",
      "How much protein do I need?",
      "Can I build muscle at home?",
      "My legs are sore, should I skip training?",
    ],
    knowledge: [
      {
        id: "m1",
        source: "First 12 Weeks program.pdf",
        text: "If you're new, start with three full-body sessions a week on non-consecutive days, like Monday, Wednesday and Friday. Each session: one squat pattern, one hinge, one push, one pull and a carry. Leave two reps in the tank on every set for the first month.",
        keywords: [
          "beginner",
          "often",
          "frequency",
          "week",
          "start",
          "new",
          "routine",
          "schedule",
          "program",
        ],
      },
      {
        id: "m2",
        source: "Eat for Strength guide.pdf",
        text: "Aim for roughly 1.6 grams of protein per kilo of body weight a day, spread over three or four meals. A palm-sized portion of eggs, paneer, tofu, chicken or lentils at each meal gets most people there without supplements.",
        keywords: ["protein", "eat", "diet", "nutrition", "food", "grams", "supplement", "whey"],
      },
      {
        id: "m3",
        source: "Home Training playbook.pdf",
        text: "Yes, you can build real strength at home. A pair of adjustable dumbbells and a resistance band cover almost everything. Progress by adding reps, slowing the lowering phase to three seconds, or switching to single-leg and single-arm versions.",
        keywords: ["home", "equipment", "dumbbell", "gym", "muscle", "build", "band"],
      },
      {
        id: "m4",
        source: "Recovery notes.txt",
        text: "Mild soreness is fine to train through: keep the session, drop the load by about 20 percent and move well. Sharp pain, swelling or pain that changes how you walk is different. Stop and get it checked.",
        keywords: [
          "sore",
          "soreness",
          "pain",
          "skip",
          "rest",
          "recover",
          "recovery",
          "doms",
          "hurt",
        ],
      },
      {
        id: "m5",
        source: "Recovery notes.txt",
        text: "Sleep is the recovery tool nobody wants to hear about. Seven to nine hours does more for your progress than any supplement. Keep one full rest day and one light walking day each week.",
        keywords: ["sleep", "rest", "day", "tired", "fatigue", "recover", "recovery"],
      },
      {
        id: "m6",
        source: "First 12 Weeks program.pdf",
        text: "Consistency beats intensity. If you miss a week, don't try to make it up. Restart at your last comfortable weights and rebuild over two sessions. Most people stall because they stop, not because the program is wrong.",
        keywords: [
          "motivation",
          "consistent",
          "consistency",
          "miss",
          "missed",
          "stuck",
          "plateau",
          "stall",
        ],
      },
      {
        id: "m7",
        source: "Eat for Strength guide.pdf",
        text: "For fat loss, keep protein high and cut about 300 to 500 calories a day, mostly from snacks and drinks. Lose around half a kilo a week so you keep your strength while the scale moves.",
        keywords: ["fat", "weight", "lose", "loss", "calorie", "calories", "cut", "lean"],
      },
    ],
    conversations: 1284,
    voiceReady: true,
    voice: { lang: "en-IN", gender: "female", pitch: 1.05, rate: 1 },
    speech: {
      voice: "Kore",
      style: "Speak warmly and encouragingly, like a coach who believes in you, at a relaxed pace.",
    },
  },
  {
    id: "c-arjun",
    slug: "arjun-on-fundraising",
    name: "Arjun on Fundraising",
    creatorName: "Arjun Mehta",
    profession: "Founder & angel investor",
    tagline: "Raise your first round without the guesswork.",
    description:
      "Arjun built and sold a logistics startup, then wrote cheques into 40 early-stage companies. His AI draws on his founder workshops and the pitch feedback he gives every week.",
    hue: 262,
    topics: ["pitch decks", "pre-seed rounds", "investor outreach", "term sheets"],
    greeting:
      "Hi, I'm Arjun's AI. I can walk you through pitch decks, finding investors and what to expect in a first round.",
    suggested: [
      "What should my pitch deck include?",
      "How do I find angel investors?",
      "How much should I raise at pre-seed?",
      "What is a SAFE?",
    ],
    knowledge: [
      {
        id: "a1",
        source: "Pitch Deck teardown workshop.pdf",
        text: "Keep the deck to about ten slides: problem, why now, solution, traction, market, business model, competition, team, the ask and use of funds. If traction is your strongest slide, move it to slide three.",
        keywords: ["deck", "pitch", "slides", "slide", "presentation", "include"],
      },
      {
        id: "a2",
        source: "Investor Outreach playbook.pdf",
        text: "Warm intros convert several times better than cold emails. Make a list of 50 angels who have backed your space, then ask founders they funded for an intro. Send a five-line forwardable email the founder can pass along as is.",
        keywords: [
          "angel",
          "angels",
          "investor",
          "investors",
          "find",
          "outreach",
          "intro",
          "email",
          "network",
        ],
      },
      {
        id: "a3",
        source: "Founder workshop notes.txt",
        text: "Raise enough for 18 to 24 months of runway to hit the milestones your next round needs. For most pre-seed companies I see, that lands somewhere between 250 thousand and 1 million dollars, depending on team size and market.",
        keywords: ["raise", "much", "amount", "preseed", "pre-seed", "runway", "round", "money"],
      },
      {
        id: "a4",
        source: "Term sheets explained.pdf",
        text: "A SAFE is a simple agreement for future equity. Investors give you money now and get shares later, usually at your next priced round, with a valuation cap and sometimes a discount. It's fast and cheap, but model your dilution before you stack several.",
        keywords: ["safe", "note", "convertible", "equity", "cap", "discount", "dilution"],
      },
      {
        id: "a5",
        source: "Term sheets explained.pdf",
        text: "The terms that matter most early are valuation, board seats, liquidation preference and pro-rata rights. Push for a 1x non-participating preference; anything more aggressive at seed is a red flag.",
        keywords: ["term", "sheet", "terms", "valuation", "board", "liquidation", "preference"],
      },
      {
        id: "a6",
        source: "Founder workshop notes.txt",
        text: "Traction beats storytelling. Ten paying customers who renewed tell an investor more than a hundred signups. Show retention and revenue per customer even if the numbers are small.",
        keywords: ["traction", "customers", "metrics", "revenue", "growth", "retention"],
      },
    ],
    conversations: 932,
    voiceReady: true,
    voice: { lang: "en-IN", gender: "male", pitch: 0.95, rate: 1 },
    speech: {
      voice: "Charon",
      style: "Speak calmly and directly, like an experienced investor giving candid advice.",
    },
  },
  {
    id: "c-priya",
    slug: "money-with-priya",
    name: "Money with Priya",
    creatorName: "Priya Nair",
    profession: "Personal finance educator",
    tagline: "Money basics, minus the jargon.",
    description:
      "Priya teaches budgeting and saving to young professionals. Her AI explains the fundamentals from her course material: general education, not personal financial advice.",
    hue: 155,
    topics: ["budgeting", "emergency funds", "paying off debt", "saving habits"],
    greeting:
      "Hi! I'm Priya's AI. I explain money basics like budgeting, emergency funds and debt. General education only, never personal advice.",
    suggested: [
      "How do I start budgeting?",
      "How big should my emergency fund be?",
      "Which debt should I pay off first?",
      "Should I buy this stock?",
    ],
    knowledge: [
      {
        id: "p1",
        source: "Budgeting 101 course.pdf",
        text: "A simple way to start is the 50-30-20 split: about half your take-home pay for needs, 30 percent for wants and 20 percent for savings and debt repayment. Track one month honestly before you set any targets.",
        keywords: [
          "budget",
          "budgeting",
          "start",
          "split",
          "income",
          "salary",
          "spend",
          "spending",
          "track",
        ],
      },
      {
        id: "p2",
        source: "Safety Net workbook.pdf",
        text: "An emergency fund of three to six months of essential expenses is the usual guideline. Keep it somewhere boring and easy to reach, separate from your everyday account so you're not tempted to dip into it.",
        keywords: ["emergency", "fund", "savings", "save", "months", "safety"],
      },
      {
        id: "p3",
        source: "Debt-free roadmap.pdf",
        text: "Two common approaches: the avalanche pays the highest-interest debt first and saves the most money; the snowball clears the smallest balance first for quick wins. Pick the one you'll actually stick with, and pay minimums on everything else.",
        keywords: ["debt", "loan", "loans", "credit", "card", "pay", "payoff", "interest", "first"],
      },
      {
        id: "p4",
        source: "About this AI.txt",
        text: "I share general financial education, not personal advice. I can't tell you whether to buy or sell a specific investment. For decisions like that, talk to a registered financial adviser who knows your full situation.",
        keywords: [
          "stock",
          "stocks",
          "buy",
          "sell",
          "invest",
          "investment",
          "crypto",
          "share",
          "shares",
          "advice",
          "recommend",
        ],
      },
      {
        id: "p5",
        source: "Budgeting 101 course.pdf",
        text: "Automate the boring parts: move your savings the day your salary lands, before you can spend it. Small automatic transfers beat big intentions every time.",
        keywords: ["automate", "automatic", "habit", "habits", "saving", "save", "consistent"],
      },
    ],
    conversations: 1720,
    voiceReady: false,
    voice: { lang: "en-IN", gender: "female", pitch: 1.1, rate: 1 },
    speech: {
      voice: "Leda",
      style: "Speak clearly and patiently, like a teacher explaining money basics without jargon.",
    },
  },
  {
    id: "c-kenji",
    slug: "kenjis-design-crit",
    name: "Kenji's Design Crit",
    creatorName: "Kenji Watanabe",
    profession: "Product designer",
    tagline: "Honest UX feedback, on demand.",
    description:
      "Kenji has led design at two consumer apps and runs a weekly portfolio review. His AI shares his critique frameworks, onboarding patterns and portfolio advice.",
    hue: 318,
    topics: ["UX critique", "onboarding", "design systems", "design portfolios"],
    greeting:
      "Hey, I'm Kenji's AI. Bring me an onboarding flow, a design system question or your portfolio worries.",
    suggested: [
      "How do I improve my app onboarding?",
      "What makes a strong design portfolio?",
      "When do we need a design system?",
    ],
    knowledge: [
      {
        id: "k1",
        source: "Onboarding patterns deck.pdf",
        text: "Get people to their first moment of value in under a minute. Cut every screen that asks for information you don't need yet, and let people explore before they sign up whenever you can.",
        keywords: [
          "onboarding",
          "signup",
          "sign",
          "first",
          "activation",
          "improve",
          "flow",
          "users",
        ],
      },
      {
        id: "k2",
        source: "Portfolio review notes.txt",
        text: "Show three deep case studies instead of ten shallow ones. For each: the problem, your constraints, two options you rejected and why, and the measurable result. Hiring managers read the reasoning, not the mockups.",
        keywords: ["portfolio", "case", "study", "studies", "hiring", "job", "interview", "strong"],
      },
      {
        id: "k3",
        source: "Design systems talk.pdf",
        text: "You need a design system when the same component gets rebuilt three different ways. Start with tokens for color, type and spacing, then buttons and inputs. Document usage, not just appearance.",
        keywords: ["design", "system", "systems", "components", "tokens", "library", "consistency"],
      },
      {
        id: "k4",
        source: "Critique framework.pdf",
        text: "When I critique a screen I ask three questions in order: what is the one thing this screen must do, what competes with it, and what can be removed. Most screens get better by subtraction.",
        keywords: ["critique", "feedback", "review", "screen", "ux", "ui", "better"],
      },
    ],
    conversations: 611,
    voiceReady: true,
    voice: { lang: "en-US", gender: "male", pitch: 0.9, rate: 0.97 },
    speech: {
      voice: "Iapetus",
      style: "Speak thoughtfully and precisely, like a designer giving considered critique.",
    },
  },
  {
    id: "c-sofia",
    slug: "profe-sofia",
    name: "Profe Sofía",
    creatorName: "Sofía Álvarez",
    profession: "Spanish teacher",
    tagline: "Speak Spanish sooner than you think.",
    description:
      "Sofía has taught Spanish online for a decade. Her AI answers from her lesson plans and the questions her students ask most, with plenty of examples.",
    hue: 70,
    topics: ["ser vs estar", "pronunciation", "study routines", "travel phrases"],
    greeting:
      "¡Hola! I'm Profe Sofía's AI. Ask me about grammar, pronunciation or how to practise every day.",
    suggested: [
      "What's the difference between ser and estar?",
      "How do I roll my Rs?",
      "How much should I study each day?",
    ],
    knowledge: [
      {
        id: "s1",
        source: "Grammar essentials.pdf",
        text: "Use ser for what something is, like identity, origin or profession: soy profesora. Use estar for states and locations: estoy cansada, estoy en Madrid. A quick test: if it could change by tomorrow, it's probably estar.",
        keywords: ["ser", "estar", "difference", "verb", "verbs", "grammar"],
      },
      {
        id: "s2",
        source: "Pronunciation drills.pdf",
        text: "For the rolled R, start with a quick 'dd' sound in 'ladder', said fast, with your tongue tapping just behind your teeth. Practise 'perro', 'carro' and 'arriba' for two minutes a day. Most students get it within a few weeks.",
        keywords: ["roll", "rolled", "pronunciation", "pronounce", "accent", "sound"],
      },
      {
        id: "s3",
        source: "Study routine guide.pdf",
        text: "Twenty focused minutes every day beats two hours on Sunday. Split it into ten minutes of listening, five of speaking out loud and five of reviewing vocabulary you missed.",
        keywords: [
          "study",
          "daily",
          "day",
          "routine",
          "practice",
          "practise",
          "minutes",
          "much",
          "long",
        ],
      },
    ],
    conversations: 845,
    voiceReady: true,
    voice: { lang: "en-GB", gender: "female", pitch: 1.1, rate: 1.03 },
    speech: {
      voice: "Aoede",
      style: "Speak brightly and clearly, like a language teacher who wants you to follow along.",
    },
  },
  {
    id: "c-rohan",
    slug: "rohan-teaches-python",
    name: "Rohan Teaches Python",
    creatorName: "Rohan Das",
    profession: "Software engineer & instructor",
    tagline: "From first script to real projects.",
    description:
      "Rohan is a backend engineer who has taught Python to more than 30,000 students. His AI answers from his course notes, exercises and debugging checklists.",
    hue: 205,
    topics: ["learning path", "list comprehensions", "virtual environments", "debugging"],
    greeting: "Hi, I'm Rohan's AI. Ask me how to learn Python, or paste a concept you're stuck on.",
    suggested: [
      "What should I learn first in Python?",
      "Explain list comprehensions",
      "Why use a virtual environment?",
      "How do I debug my code?",
    ],
    knowledge: [
      {
        id: "r1",
        source: "Python roadmap.pdf",
        text: "Learn in this order: variables and types, conditions and loops, functions, lists and dictionaries, then files and error handling. After that, build one small project, like a budget tracker or a scraper, before touching any framework.",
        keywords: ["learn", "first", "start", "beginner", "roadmap", "order", "path"],
      },
      {
        id: "r2",
        source: "Course notes: lists.pdf",
        text: "A list comprehension builds a list in one line: squares = [n * n for n in numbers if n > 0]. Read it as 'n times n, for each n in numbers, keeping only positive ones'. Use a normal loop when the logic needs more than one condition.",
        keywords: ["list", "comprehension", "comprehensions", "loop", "one-liner"],
      },
      {
        id: "r3",
        source: "Project setup checklist.txt",
        text: "A virtual environment keeps each project's packages separate, so upgrading a library for one project can't break another. Create one per project and never install packages globally.",
        keywords: ["virtual", "environment", "venv", "packages", "install", "pip", "uv"],
      },
      {
        id: "r4",
        source: "Debugging checklist.txt",
        text: "Read the last line of the traceback first: it names the error. Then find the line number it points to, print the variables just before it, and reproduce the bug with the smallest input you can.",
        keywords: ["debug", "debugging", "error", "bug", "traceback", "exception", "fix", "broken"],
      },
    ],
    conversations: 2310,
    voiceReady: true,
    voice: { lang: "en-IN", gender: "male", pitch: 1, rate: 1.05 },
    speech: {
      voice: "Puck",
      style: "Speak with friendly energy, like an instructor who enjoys explaining things.",
    },
  },
]

export function getDemoCharacter(slug: string): DemoCharacter | undefined {
  return DEMO_CHARACTERS.find((character) => character.slug === slug)
}

export function knowledgeSources(character: Pick<DemoCharacter, "knowledge">): string[] {
  return [...new Set(character.knowledge.map((snippet) => snippet.source))]
}
