// Sample audience conversations shown in the demo creator's studio. All names are fictional.

export type DemoTranscriptMessage = {
  role: "user" | "assistant"
  text: string
  sources?: string[]
}

export type DemoConversation = {
  id: string
  characterSlug: string
  audienceName: string
  channel: "text" | "voice"
  startedAt: string
  messages: DemoTranscriptMessage[]
}

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "cv-1042",
    characterSlug: "coach-maya",
    audienceName: "Ananya S.",
    channel: "voice",
    startedAt: "2026-09-22T07:41:00Z",
    messages: [
      { role: "user", text: "I just started lifting. How many days a week should I go?" },
      {
        role: "assistant",
        text: "Start with three full-body sessions a week on non-consecutive days, like Monday, Wednesday and Friday. Leave two reps in the tank on every set for the first month.",
        sources: ["First 12 Weeks program.pdf"],
      },
      { role: "user", text: "And protein? I'm vegetarian." },
      {
        role: "assistant",
        text: "Aim for roughly 1.6 grams per kilo of body weight a day, over three or four meals. Paneer, tofu, eggs or lentils at each meal gets most people there without supplements.",
        sources: ["Eat for Strength guide.pdf"],
      },
    ],
  },
  {
    id: "cv-1039",
    characterSlug: "coach-maya",
    audienceName: "Rahul K.",
    channel: "text",
    startedAt: "2026-09-21T19:12:00Z",
    messages: [
      { role: "user", text: "My legs are killing me after squats yesterday. Skip today?" },
      {
        role: "assistant",
        text: "Mild soreness is fine to train through: keep the session, drop the load by about 20 percent and move well. Sharp pain, swelling or pain that changes how you walk is different. Stop and get it checked.",
        sources: ["Recovery notes.txt"],
      },
      { role: "user", text: "Can you write me a keto meal plan?" },
      {
        role: "assistant",
        text: "That's not something Maya Rao has covered in the knowledge they've approved for me, so I won't guess. I can help with beginner training, protein and nutrition or recovery.",
      },
    ],
  },
  {
    id: "cv-1031",
    characterSlug: "coach-maya",
    audienceName: "Meera P.",
    channel: "text",
    startedAt: "2026-09-21T06:05:00Z",
    messages: [
      { role: "user", text: "Can I build muscle with just dumbbells at home?" },
      {
        role: "assistant",
        text: "Yes, you can build real strength at home. A pair of adjustable dumbbells and a resistance band cover almost everything. Progress by adding reps, slowing the lowering phase or going single-leg.",
        sources: ["Home Training playbook.pdf"],
      },
    ],
  },
  {
    id: "cv-1024",
    characterSlug: "coach-maya",
    audienceName: "Dev T.",
    channel: "voice",
    startedAt: "2026-09-20T16:48:00Z",
    messages: [
      { role: "user", text: "I missed two weeks. Should I double up to catch up?" },
      {
        role: "assistant",
        text: "Consistency beats intensity. Don't try to make it up. Restart at your last comfortable weights and rebuild over two sessions.",
        sources: ["First 12 Weeks program.pdf"],
      },
    ],
  },
]

export function getDemoConversation(id: string): DemoConversation | undefined {
  return DEMO_CONVERSATIONS.find((conversation) => conversation.id === id)
}
