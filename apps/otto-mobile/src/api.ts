// Talks to the same Otto backend as the web app (lumin42-site: netlify/functions/otto-app.js at /api/otto).
// Otto's rules, playbooks and the only quotable prices live there, so web and mobile never disagree.

export const OTTO_API = process.env.EXPO_PUBLIC_OTTO_API || "https://lumin42.com/api/otto";

export type Space = "ask" | "life" | "business" | "learn" | "create";
export type Msg = { role: "user" | "assistant"; content: string; flags?: string[] };
export type Profile = Record<string, string>;

export async function askOtto(message: string, space: Space, history: Msg[], profile: Profile | null) {
  const res = await fetch(OTTO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      space,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      profile,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { answer?: string; flags?: string[]; error?: string };
  if (!res.ok || !data.answer) throw new Error(data.error || "Otto can't answer right now. Please try again in a moment.");
  return { answer: data.answer, flags: data.flags || [] };
}
