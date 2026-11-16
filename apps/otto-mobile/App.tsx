// Otto AI: native app (iOS and Android), MVP foundation. Built 16 Nov 2026.
// Same brain as the web app at lumin42.com/otto-app (see src/api.ts). Scope and tests: MVP-SPEC.md.
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView,
  type ScrollViewInstance, StyleSheet, Text, TextInput, View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import * as Clipboard from "expo-clipboard";
import { askOtto, Msg, Profile, Space } from "./src/api";
import { clearAll, load, save } from "./src/store";
import { C } from "./src/theme";

type Tab = "home" | "chat" | "life" | "business" | "learn";
type Task = { text: string; done: boolean };

const SPACE_LABEL: Record<Space, string> = {
  ask: "Ask anything", life: "Life and planning", business: "Business advisor", learn: "Learning", create: "Writing partner",
};
const WELCOME: Msg = {
  role: "assistant",
  content: "Hello, I'm Otto. Ask me anything, or tell me what you need done. I'll help where I can, and if it needs another tool I'll tell you which one and how.",
};
const BIZ_QS: [string, string][] = [
  ["business_name", "Business name"],
  ["business_type", "What the business does"],
  ["team_size", "How many people"],
  ["current_tools", "Tools you use now (email, calendar, CRM, accounts, booking, phone)"],
  ["biggest_problem", "Biggest time-waster right now"],
  ["budget", "Rough budget to fix it (free only / up to £50 / up to £500 / more / not sure)"],
];

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Otto />
    </SafeAreaProvider>
  );
}

function Otto() {
  const [tab, setTab] = useState<Tab>("home");
  const [space, setSpace] = useState<Space>("ask");
  const [history, setHistory] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [biz, setBiz] = useState<Profile>({});

  useEffect(() => {
    (async () => {
      setHistory(await load<Msg[]>("history", []));
      setTasks(await load<Task[]>("tasks", []));
      setBiz(await load<Profile>("biz", {}));
      setSpeak(await load<boolean>("speak", false));
    })();
  }, []);

  async function send(text: string, sp?: Space) {
    const msg = text.trim();
    if (!msg || busy) return;
    const s = sp || space;
    if (sp) setSpace(sp);
    setTab("chat");
    const before = history;
    const next: Msg[] = [...before, { role: "user", content: msg }];
    setHistory(next);
    setBusy(true);
    let reply: Msg;
    try {
      const hasBiz = Object.values(biz).some(Boolean);
      const r = await askOtto(msg, s, before, hasBiz ? biz : null);
      reply = { role: "assistant", content: r.answer, flags: r.flags };
      if (speak) say(r.answer);
    } catch (e) {
      reply = { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong. Please try again." };
    }
    const done = [...next, reply].slice(-30);
    setHistory(done);
    save("history", done);
    setBusy(false);
  }

  function say(t: string) {
    Speech.stop();
    Speech.speak(t.replace(/https?:\/\/\S+/g, "the link"), { language: "en-GB" });
  }

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <Header onInfo={() => about()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {tab === "home" && <Home send={send} go={(t, s) => { if (s) setSpace(s); setTab(t); }} />}
        {tab === "chat" && (
          <Chat
            history={history} busy={busy} space={space} setSpace={setSpace} speak={speak}
            toggleSpeak={() => { const v = !speak; setSpeak(v); save("speak", v); if (!v) Speech.stop(); }}
            clear={() => { setHistory([]); save("history", []); }}
            send={send} say={say}
          />
        )}
        {tab === "life" && <Life tasks={tasks} setTasks={(t) => { setTasks(t); save("tasks", t); }} send={send} />}
        {tab === "business" && <Business biz={biz} setBiz={(b) => { setBiz(b); save("biz", b); }} send={send} />}
        {tab === "learn" && <Learn send={send} />}
      </KeyboardAvoidingView>
      <Tabs tab={tab} setTab={setTab} />
    </SafeAreaView>
  );
}

function about() {
  Alert.alert(
    "About Otto",
    "Otto is an AI companion from lumin42, a UK AI studio run by Matthew Creighton. Otto explains, plans and drafts. It can't act in your apps yet; when a job needs another tool, it tells you which one.\n\nOtto can make mistakes. Not medical, legal, tax or financial advice. In an emergency call 999. Never share passwords or card details.\n\nYour tasks, business details and chats are saved on this phone only. Messages go to lumin42's server and our AI provider, Anthropic, to write the answer; lumin42 doesn't keep the text.",
    [
      { text: "Delete my data", style: "destructive", onPress: () => clearAll() },
      { text: "Otto for Work", onPress: () => Linking.openURL("https://lumin42.com/otto") },
      { text: "Close", style: "cancel" },
    ],
  );
}

function Header({ onInfo }: { onInfo: () => void }) {
  return (
    <View style={st.header}>
      <View>
        <Text style={st.kicker}>LUMIN42 INTELLIGENCE</Text>
        <Text style={st.brand}>Otto</Text>
      </View>
      <View style={st.row}>
        <View style={st.pill}><View style={st.dot} /><Text style={{ color: C.ok, fontSize: 12 }}>Online</Text></View>
        <Pressable onPress={onInfo} style={st.iconBtn} accessibilityLabel="About Otto"><Text style={st.iconTxt}>i</Text></Pressable>
      </View>
    </View>
  );
}

function Orb({ size = 120 }: { size?: number }) {
  return (
    <View style={[st.orbRing, { width: size + 28, height: size + 28, borderRadius: (size + 28) / 2 }]}>
      <View style={[st.orb, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[st.orbCore, { width: size * 0.62, height: size * 0.62, borderRadius: size }]} />
        <View style={[st.orbShine, { width: size * 0.22, height: size * 0.22, borderRadius: size, top: size * 0.18, left: size * 0.22 }]} />
      </View>
    </View>
  );
}

function AskBox({ onSend, placeholder }: { onSend: (t: string) => void; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <View style={st.ask}>
      <TextInput
        style={st.askIn} value={v} onChangeText={setV} placeholder={placeholder} placeholderTextColor={C.mut}
        multiline accessibilityLabel="Message Otto"
      />
      <Pressable style={st.go} accessibilityLabel="Send" onPress={() => { onSend(v); setV(""); }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>→</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={st.chip} onPress={onPress}><Text style={st.chipTxt}>{label}</Text></Pressable>;
}

function Home({ send, go }: { send: (t: string, s?: Space) => void; go: (t: Tab, s?: Space) => void }) {
  const tiles: [string, string, string, () => void][] = [
    ["💬", "Ask Otto", "Chat and read-aloud", () => go("chat", "ask")],
    ["🗓️", "My Life", "Tasks and planning", () => go("life")],
    ["💼", "My Business", "Advice, tools and plans", () => go("business")],
    ["🎓", "Learn", "Explain, practise, quiz", () => go("learn")],
    ["✨", "Create", "Emails, posts, documents", () => go("chat", "create")],
    ["🧰", "Right tool", "If Otto can't, it says what can", () => send("What can you do for me, and what can't you do yet? Be honest.", "ask")],
  ];
  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <View style={st.hero}>
        <Orb />
        <Text style={st.h1}>How can I <Text style={{ color: C.gold, fontStyle: "italic" }}>help</Text> today?</Text>
        <Text style={st.sub}>Your AI companion for life and work. If I can't do the job, I'll tell you the tool that can.</Text>
        <AskBox placeholder="Ask Otto anything…" onSend={(t) => send(t)} />
        <Text style={st.hint}>Tip: tap the microphone on your keyboard to talk instead of typing.</Text>
      </View>
      <Text style={st.k}>YOUR COMMAND CENTRE</Text>
      <View style={st.grid}>
        {tiles.map(([ic, t, d, f]) => (
          <Pressable key={t} style={st.tile} onPress={f}>
            <Text style={{ fontSize: 20 }}>{ic}</Text>
            <Text style={st.tileH}>{t}</Text>
            <Text style={st.tileP}>{d}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={st.note}>Otto is an AI. It explains, plans and drafts; it can't send, book or pay for you yet. Don't share passwords or card details.</Text>
    </ScrollView>
  );
}

function Chat(p: {
  history: Msg[]; busy: boolean; space: Space; setSpace: (s: Space) => void; speak: boolean; toggleSpeak: () => void;
  clear: () => void; send: (t: string) => void; say: (t: string) => void;
}) {
  const ref = useRef<ScrollViewInstance>(null);
  const msgs = p.history.length ? p.history : [WELCOME];
  const spaces: Space[] = ["ask", "life", "business", "learn", "create"];
  return (
    <View style={{ flex: 1 }}>
      <View style={st.chatHead}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {spaces.map((s) => (
            <Pressable key={s} onPress={() => p.setSpace(s)} style={[st.seg, p.space === s && st.segOn]}>
              <Text style={{ color: p.space === s ? C.fg : C.mut, fontSize: 13 }}>{s[0].toUpperCase() + s.slice(1)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={p.toggleSpeak} style={[st.iconBtn, p.speak && { borderColor: C.vi }]} accessibilityLabel="Read answers aloud">
          <Text style={st.iconTxt}>{p.speak ? "🔊" : "🔈"}</Text>
        </Pressable>
        <Pressable onPress={p.clear} style={st.iconBtn} accessibilityLabel="New conversation"><Text style={st.iconTxt}>＋</Text></Pressable>
      </View>
      <Text style={st.spaceLbl}>{SPACE_LABEL[p.space]}</Text>
      <ScrollView ref={ref} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}
        onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}>
        {msgs.map((m, i) => (
          <View key={i} style={[st.msg, m.role === "user" ? st.mu : st.ma]}>
            <Text style={st.msgTxt} selectable>{m.content}</Text>
            {m.role === "assistant" && m.flags && m.flags.length > 0 && (
              <Text style={st.flag}>{m.flags.map((f) => "⚠ " + f).join("\n")}</Text>
            )}
            {m.role === "assistant" && (
              <View style={[st.row, { marginTop: 8, gap: 6 }]}>
                <Pressable style={st.act} onPress={() => Clipboard.setStringAsync(m.content)}><Text style={st.actTxt}>Copy</Text></Pressable>
                <Pressable style={st.act} onPress={() => p.say(m.content)}><Text style={st.actTxt}>Read aloud</Text></Pressable>
              </View>
            )}
          </View>
        ))}
        {p.busy && <View style={[st.msg, st.ma]}><ActivityIndicator color={C.vi} /></View>}
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <AskBox placeholder="Message Otto…" onSend={p.send} />
      </View>
    </View>
  );
}

function Life({ tasks, setTasks, send }: { tasks: Task[]; setTasks: (t: Task[]) => void; send: (t: string, s?: Space) => void }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { setTasks([...tasks, { text: v.trim(), done: false }]); setV(""); } };
  const plan = () => {
    const open = tasks.filter((t) => !t.done).map((t) => "- " + t.text).join("\n");
    send(open
      ? "Here's my list for today:\n" + open + "\nPut it in a sensible order with rough times, flag anything I should drop or delegate, and tell me what to do first."
      : "Help me plan today. Ask me what I need to get done.", "life");
  };
  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <Text style={st.h2}>My Life</Text>
      <Text style={st.sub2}>Your list lives on this phone only. Otto can turn it into a plan.</Text>
      <View style={st.card}>
        <View style={st.row}>
          <TextInput style={[st.in, { flex: 1 }]} value={v} onChangeText={setV} placeholder="Add a task…" placeholderTextColor={C.mut}
            onSubmitEditing={add} returnKeyType="done" maxLength={140} />
          <Pressable style={[st.go, { marginLeft: 8 }]} onPress={add} accessibilityLabel="Add task"><Text style={{ color: "#fff", fontSize: 20 }}>+</Text></Pressable>
        </View>
        {tasks.length === 0 && <Text style={[st.note, { marginBottom: 0 }]}>Nothing yet. Add what's on your mind.</Text>}
        {tasks.map((t, i) => (
          <View key={i} style={st.task}>
            <Pressable onPress={() => setTasks(tasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
              style={[st.check, t.done && { backgroundColor: C.vi, borderColor: C.vi }]} accessibilityLabel="Done">
              {t.done && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
            </Pressable>
            <Text style={[st.taskTxt, t.done && { color: C.mut, textDecorationLine: "line-through" }]}>{t.text}</Text>
            <Pressable onPress={() => setTasks(tasks.filter((_, j) => j !== i))} accessibilityLabel="Remove"><Text style={{ color: C.mut, fontSize: 18 }}>×</Text></Pressable>
          </View>
        ))}
      </View>
      <Pressable style={st.btn} onPress={plan}><Text style={st.btnTxt}>Plan my day with Otto</Text></Pressable>
      <Text style={st.k}>LIFE HELPERS</Text>
      <View style={st.chips}>
        <Chip label="Morning routine" onPress={() => send("Help me build a simple morning routine I'll actually stick to.", "life")} />
        <Chip label="Food shop list" onPress={() => send("Make me a weekly food shop list for a family of four on a tight budget.", "life")} />
        <Chip label="Too much on" onPress={() => send("I've got too much on. Help me decide what to drop this week.", "life")} />
      </View>
    </ScrollView>
  );
}

function Business({ biz, setBiz, send }: { biz: Profile; setBiz: (b: Profile) => void; send: (t: string, s?: Space) => void }) {
  const [draft, setDraft] = useState<Profile>(biz);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(biz), [biz]);
  const chips: [string, string][] = [
    ["What should I fix first?", "Look at my business details and tell me the one bottleneck you'd fix first, and how."],
    ["Pick my tools", "Which tools should I be using for bookings, invoices and customer follow-up? Smallest setup first."],
    ["Plan a week of marketing", "Run your Weekly Promotion Workflow with me for one offer. Ask me for the brief first."],
    ["Weekly growth sprint", "Use your High Growth System on my business: help me pick one metric per stage and this week's one experiment."],
    ["Build my command centre", "Help me design a simple Command Centre for my business: the four questions, the tools and a daily routine."],
    ["Cold email rules", "Can I cold email sole traders in the UK?"],
  ];
  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <Text style={st.h2}>My Business</Text>
      <Text style={st.sub2}>Tell Otto about your business once, and every answer fits it. Saved on this phone only.</Text>
      <View style={st.card}>
        {BIZ_QS.map(([k, q]) => (
          <View key={k}>
            <Text style={st.label}>{q}</Text>
            <TextInput style={st.in} value={draft[k] || ""} maxLength={200} placeholderTextColor={C.mut}
              onChangeText={(t) => { setDraft({ ...draft, [k]: t }); setSaved(false); }} />
          </View>
        ))}
        <Pressable style={st.btn} onPress={() => { setBiz(draft); setSaved(true); }}><Text style={st.btnTxt}>Save</Text></Pressable>
        {saved && <Text style={st.note}>Saved on this phone. Otto will use it in every answer.</Text>}
      </View>
      <Text style={st.k}>ASK ABOUT YOUR BUSINESS</Text>
      <View style={st.chips}>{chips.map(([l, q]) => <Chip key={l} label={l} onPress={() => send(q, "business")} />)}</View>
      <Text style={st.note}>Discounts, contracts, refunds, legal or complaints go to Matthew, a real person. Otto will say "That one needs Matthew personally" and he replies by the next working day.</Text>
    </ScrollView>
  );
}

function Learn({ send }: { send: (t: string, s?: Space) => void }) {
  const [t, setT] = useState("");
  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <Text style={st.h2}>Learn</Text>
      <Text style={st.sub2}>Any subject, explained simply, at your pace.</Text>
      <View style={st.card}>
        <Text style={st.label}>What do you want to learn?</Text>
        <TextInput style={st.in} value={t} onChangeText={setT} placeholder="e.g. how VAT works, Spanish basics" placeholderTextColor={C.mut} maxLength={120} />
        <View style={[st.row, { gap: 8, marginTop: 10 }]}>
          <Pressable style={[st.btn, { flex: 1, marginTop: 0 }]} onPress={() => t.trim() && send("Explain " + t + " simply, step by step, then check I understood with one question.", "learn")}>
            <Text style={st.btnTxt}>Explain it</Text></Pressable>
          <Pressable style={[st.btn, st.btnGhost, { flex: 1, marginTop: 0 }]} onPress={() => t.trim() && send("Quiz me on " + t + ". Three questions, one at a time, and tell me if I'm right.", "learn")}>
            <Text style={st.btnTxt}>Quiz me</Text></Pressable>
        </View>
      </View>
      <Text style={st.k}>POPULAR</Text>
      <View style={st.chips}>
        <Chip label="AI at work, 5 lessons" onPress={() => send("Teach me how to use AI tools safely at work, in 5 short lessons. Start with lesson 1.", "learn")} />
        <Chip label="Interview practice" onPress={() => send("Help me practise for a job interview. Ask me one question at a time.", "learn")} />
        <Chip label="Read a payslip" onPress={() => send("Explain how to read a payslip in the UK.", "learn")} />
      </View>
    </ScrollView>
  );
}

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: [Tab, string, string][] = [["home", "🏠", "Home"], ["chat", "💬", "Chat"], ["life", "📅", "Life"], ["business", "💼", "Business"], ["learn", "🎓", "Learn"]];
  return (
    <SafeAreaView edges={["bottom"]} style={st.tabs}>
      {items.map(([k, ic, l]) => (
        <Pressable key={k} style={st.tabBtn} onPress={() => setTab(k)} accessibilityLabel={l}>
          <Text style={{ fontSize: 18, opacity: tab === k ? 1 : 0.55 }}>{ic}</Text>
          <Text style={{ fontSize: 11, color: tab === k ? C.fg : C.mut }}>{l}</Text>
        </Pressable>
      ))}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: "row", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10 },
  kicker: { color: C.mut, fontSize: 10, letterSpacing: 2.5, fontWeight: "600" },
  brand: { color: C.fg, fontSize: 28, fontFamily: Platform.select({ ios: "Georgia", default: "serif" }) },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(94,224,168,0.4)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.ok },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  iconTxt: { color: C.fg, fontSize: 16, fontWeight: "600" },
  page: { padding: 16, paddingBottom: 40 },
  hero: { borderWidth: 1, borderColor: C.line, borderRadius: 26, padding: 18, alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  orbRing: { borderWidth: 1, borderColor: "rgba(243,216,146,0.35)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  orb: { backgroundColor: "#5b3df5", alignItems: "center", justifyContent: "center", shadowColor: C.vi2, shadowOpacity: 0.8, shadowRadius: 30, elevation: 12, overflow: "hidden" },
  orbCore: { backgroundColor: C.vi, opacity: 0.9 },
  orbShine: { position: "absolute", backgroundColor: "#fff", opacity: 0.85 },
  h1: { color: C.fg, fontSize: 30, textAlign: "center", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), marginTop: 4 },
  sub: { color: C.mut, textAlign: "center", fontSize: 14, marginVertical: 10 },
  hint: { color: C.mut, fontSize: 12, marginTop: 8 },
  ask: { flexDirection: "row", alignItems: "flex-end", width: "100%", backgroundColor: "rgba(0,0,0,0.35)", borderWidth: 1, borderColor: C.line2, borderRadius: 18, padding: 8, paddingLeft: 14 },
  askIn: { flex: 1, color: C.fg, fontSize: 16, maxHeight: 140, paddingVertical: 8 },
  go: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.vi2, alignItems: "center", justifyContent: "center" },
  k: { color: C.vi, fontSize: 11, letterSpacing: 2.2, fontWeight: "700", marginTop: 24, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "48%", flexGrow: 1, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 18, padding: 14, minHeight: 100 },
  tileH: { color: C.fg, fontSize: 16, fontWeight: "600", marginTop: 6 },
  tileP: { color: C.mut, fontSize: 12, marginTop: 2 },
  note: { color: C.mut, fontSize: 12, lineHeight: 18, marginVertical: 12 },
  chatHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 4 },
  seg: { borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 },
  segOn: { borderColor: C.vi, backgroundColor: "rgba(124,92,255,0.18)" },
  spaceLbl: { color: C.mut, fontSize: 12, paddingHorizontal: 18, marginTop: 6 },
  msg: { maxWidth: "88%", padding: 12, borderRadius: 18 },
  mu: { alignSelf: "flex-end", backgroundColor: C.vi2, borderBottomRightRadius: 6 },
  ma: { alignSelf: "flex-start", backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 6 },
  msgTxt: { color: C.fg, fontSize: 15, lineHeight: 22 },
  flag: { color: C.warn, fontSize: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: "rgba(240,179,90,0.4)", paddingTop: 6 },
  act: { borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  actTxt: { color: C.mut, fontSize: 11 },
  h2: { color: C.fg, fontSize: 30, fontFamily: Platform.select({ ios: "Georgia", default: "serif" }) },
  sub2: { color: C.mut, fontSize: 14, marginTop: 2, marginBottom: 14 },
  card: { borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 18, padding: 16 },
  in: { backgroundColor: "rgba(0,0,0,0.3)", borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, color: C.fg, fontSize: 16 },
  label: { color: C.mut, fontSize: 13, marginTop: 12, marginBottom: 6 },
  btn: { backgroundColor: C.vi2, borderRadius: 14, padding: 14, alignItems: "center", marginTop: 12 },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.line },
  btnTxt: { color: "#fff", fontWeight: "600", fontSize: 15 },
  task: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.mut, alignItems: "center", justifyContent: "center" },
  taskTxt: { flex: 1, color: C.fg, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  chipTxt: { color: C.fg, fontSize: 13 },
  tabs: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line, backgroundColor: "rgba(7,6,13,0.96)" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, gap: 2 },
});
