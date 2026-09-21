import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Activity,
  ArrowDownToLine,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileJson,
  Filter,
  Instagram,
  KeyRound,
  LaptopMinimal,
  ListFilter,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  Waypoints,
  Wifi,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Tab = "home" | "rules" | "settings" | "logs";
type AppTarget = "whatsapp" | "instagram";
type LogStatus = "template" | "ai" | "skipped";

type Rule = {
  id: string;
  trigger: string;
  response: string;
  enabled: boolean;
};

type LogEntry = {
  id: string;
  sender: string;
  handle: string;
  app: AppTarget;
  message: string;
  reply: string;
  status: LogStatus;
  time: string;
};

type AppState = {
  active: boolean;
  permissionGranted: boolean;
  targets: Record<AppTarget, boolean>;
  systemPrompt: string;
  fallback: "ai" | "skip";
  cooldown: number;
  delay: number;
  baseUrl: string;
  apiKey: string;
  model: string;
  rules: Rule[];
  logs: LogEntry[];
};

const STORAGE_KEY = "study-ai-automation-state";

const starterRules: Rule[] = [
  { id: "welcome", trigger: "hi, hello, hey", response: "Hey! I’m away right now, but I’ll get back to you soon.", enabled: true },
  { id: "availability", trigger: "are you free, available", response: "I’m checking my schedule and will reply shortly.", enabled: true },
];

const starterLogs: LogEntry[] = [
  { id: "log-1", sender: "Maya Chen", handle: "@mayachen", app: "instagram", message: "Hey! Are you free for a quick call later?", reply: "I’m checking my schedule and will reply shortly.", status: "template", time: "Today · 10:42 AM" },
  { id: "log-2", sender: "Arjun Mehta", handle: "+91 98450 22104", app: "whatsapp", message: "Can you send the notes from yesterday?", reply: "I’m away right now, but I’ll get back to you soon.", status: "ai", time: "Today · 09:18 AM" },
  { id: "log-3", sender: "Studio Group", handle: "12 participants", app: "whatsapp", message: "Lunch at 1?", reply: "No reply sent", status: "skipped", time: "Yesterday · 06:31 PM" },
];

const defaultState: AppState = {
  active: true,
  permissionGranted: false,
  targets: { whatsapp: true, instagram: true },
  systemPrompt: "Act as my personal assistant. Keep replies under 20 words, sound warm and clear, and never promise a time I have not confirmed.",
  fallback: "ai",
  cooldown: 15,
  delay: 4,
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  rules: starterRules,
  logs: starterLogs,
};

const iconForApp = (app: AppTarget) => app === "instagram" ? Instagram : MessageCircle;

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study AI automation — Local auto-responder" },
      { name: "description", content: "A private, local-first notification assistant for WhatsApp and Instagram." },
      { property: "og:title", content: "Study AI automation — Local auto-responder" },
      { property: "og:description", content: "Manage private notification automation, reply rules, and message history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudyAutomation,
});

function StudyAutomation() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [logFilter, setLogFilter] = useState<"all" | AppTarget | LogStatus>("all");
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionState, setConnectionState] = useState<"idle" | "testing" | "success" | "error">("idle");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...defaultState, ...JSON.parse(saved) });
    } catch {
      setToast("Saved settings could not be loaded");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateState = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const toggleTarget = (target: AppTarget) => {
    setState((current) => ({ ...current, targets: { ...current.targets, [target]: !current.targets[target] } }));
    setToast(`${target === "whatsapp" ? "WhatsApp" : "Instagram"} target updated`);
  };

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(state.logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "study-ai-logs.json";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Logs exported as JSON");
  };

  const testConnection = async () => {
    if (!state.baseUrl.trim()) {
      setConnectionState("error");
      setToast("Add a provider URL first");
      return;
    }
    setConnectionState("testing");
    try {
      const headers: HeadersInit = state.apiKey ? { Authorization: `Bearer ${state.apiKey}` } : {};
      const response = await fetch(`${state.baseUrl.replace(/\/$/, "")}/models`, { headers });
      if (!response.ok) throw new Error(`Connection returned ${response.status}`);
      setConnectionState("success");
      setToast("Provider connection verified");
    } catch {
      setConnectionState("error");
      setToast("Could not reach this provider");
    }
  };

  const filteredLogs = useMemo(() => state.logs.filter((log) => {
    const matchesFilter = logFilter === "all" || log.app === logFilter || log.status === logFilter;
    const query = search.toLowerCase();
    return matchesFilter && (!query || `${log.sender} ${log.message} ${log.reply}`.toLowerCase().includes(query));
  }), [state.logs, logFilter, search]);

  const openNotificationSettings = () => {
    const bridge = (window as Window & { Capacitor?: { Plugins?: { AutoReply?: { openNotificationAccess: () => Promise<void> } } } }).Capacitor?.Plugins?.AutoReply;
    if (bridge) bridge.openNotificationAccess();
    else setToast("Notification access opens when running the Android app");
  };

  return (
    <main className="study-app min-h-screen bg-background text-foreground">
      <div className="app-shell mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 sm:px-6 lg:px-10">
        <header className="topbar flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="brand-mark"><Sparkles size={19} /></div>
            <div>
              <p className="brand-name">Study AI</p>
              <p className="brand-caption">automation workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="privacy-chip"><LockKeyhole size={12} /> local only</span>
            <Button variant="ghost" size="icon" className="icon-button" title="More options" aria-label="More options"><MoreHorizontal size={19} /></Button>
          </div>
        </header>

        <section className={`permission-banner ${state.permissionGranted ? "permission-ok" : "permission-warn"}`}>
          <div className="status-icon">{state.permissionGranted ? <ShieldCheck size={19} /> : <Activity size={19} />}</div>
          <div className="min-w-0 flex-1">
            <p className="status-title">{state.permissionGranted ? "Assistant active & listening" : "Notification access needed"}</p>
            <p className="status-subtitle">{state.permissionGranted ? "Watching selected apps in the background" : "Allow access to read notifications and send direct replies"}</p>
          </div>
          {!state.permissionGranted && <Button size="sm" variant="outline" className="banner-action" onClick={openNotificationSettings}>Enable access <ChevronRight size={14} /></Button>}
          {state.permissionGranted && <span className="live-dot" aria-label="Live status" />}
        </section>

        <section className="page-heading flex items-end justify-between gap-4 pb-6 pt-8">
          <div>
            <p className="eyebrow">{tab === "home" ? "Overview" : tab === "rules" ? "Automation logic" : tab === "settings" ? "Workspace controls" : "Activity history"}</p>
            <h1>{tab === "home" ? "Good morning, Ajit" : tab === "rules" ? "Rules & AI" : tab === "settings" ? "Settings" : "Message logs"}</h1>
          </div>
          {tab === "home" && <div className="master-toggle"><span className="master-label">Master switch</span><Switch checked={state.active} onCheckedChange={(checked) => { updateState("active", checked); setToast(checked ? "Assistant is on" : "Assistant is paused"); }} aria-label="Master switch" /></div>}
        </section>

        {tab === "home" && <HomeView state={state} onToggleTarget={toggleTarget} onNavigate={setTab} />}
        {tab === "rules" && <RulesView state={state} setState={setState} setToast={setToast} />}
        {tab === "settings" && <SettingsView state={state} updateState={updateState} showApiKey={showApiKey} setShowApiKey={setShowApiKey} connectionState={connectionState} testConnection={testConnection} openNotificationSettings={openNotificationSettings} setToast={setToast} />}
        {tab === "logs" && <LogsView logs={filteredLogs} search={search} setSearch={setSearch} filter={logFilter} setFilter={setLogFilter} exportLogs={exportLogs} clearLogs={() => { updateState("logs", []); setToast("Message logs cleared"); }} />}

        <nav className="bottom-nav" aria-label="Main navigation">
          <NavItem icon={Zap} label="Home" active={tab === "home"} onClick={() => setTab("home")} />
          <NavItem icon={Waypoints} label="Rules & AI" active={tab === "rules"} onClick={() => setTab("rules")} />
          <NavItem icon={Settings2} label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} />
          <NavItem icon={ListFilter} label="Logs" active={tab === "logs"} onClick={() => setTab("logs")} badge={state.logs.length} />
        </nav>
      </div>
      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    </main>
  );
}

function NavItem({ icon: Icon, label, active, onClick, badge }: { icon: typeof Zap; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return <Button variant="ghost" className={`nav-item ${active ? "nav-item-active" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined}><span className="nav-icon-wrap"><Icon size={19} />{badge ? <span className="nav-badge">{badge}</span> : null}</span><span>{label}</span></Button>;
}

function HomeView({ state, onToggleTarget, onNavigate }: { state: AppState; onToggleTarget: (target: AppTarget) => void; onNavigate: (tab: Tab) => void }) {
  const repliesToday = state.logs.filter((log) => log.time.startsWith("Today") && log.status !== "skipped").length;
  return <div className="space-y-5">
    <section className="hero-panel">
      <div className="hero-copy">
        <div className="hero-icon"><Bot size={22} /></div>
        <p className="eyebrow accent-eyebrow">Private assistant</p>
        <h2>Quietly handles the<br /><span>messages you choose.</span></h2>
        <p className="hero-description">Rules run first. Your AI provider only sees a message when you allow it.</p>
        <Button className="hero-button" onClick={() => onNavigate("rules")}>Tune your rules <ChevronRight size={16} /></Button>
      </div>
      <div className="signal-visual" aria-hidden="true"><div className="signal-ring ring-one" /><div className="signal-ring ring-two" /><div className="signal-core"><Zap size={25} /></div><span className="signal-label label-top">PRIVATE</span><span className="signal-label label-bottom">LOCAL-FIRST</span></div>
    </section>

    <section className="stats-grid">
      <StatCard label="Replies today" value={String(repliesToday).padStart(2, "0")} detail="+12% vs yesterday" trend="up" icon={Send} />
      <StatCard label="Rules active" value={String(state.rules.filter((rule) => rule.enabled).length).padStart(2, "0")} detail={`${state.rules.length} total templates`} icon={Waypoints} />
      <StatCard label="Time saved" value="1.4h" detail="estimated this week" icon={Clock3} />
    </section>

    <section className="section-block">
      <SectionHeader title="Connected apps" action="Manage" onClick={() => onNavigate("settings")} />
      <div className="app-list">
        <AppTargetRow app="whatsapp" name="WhatsApp" detail="Personal account" enabled={state.targets.whatsapp} onToggle={() => onToggleTarget("whatsapp")} />
        <AppTargetRow app="instagram" name="Instagram" detail="Direct messages" enabled={state.targets.instagram} onToggle={() => onToggleTarget("instagram")} />
      </div>
    </section>

    <section className="section-block">
      <SectionHeader title="Recent activity" action="View all" onClick={() => onNavigate("logs")} />
      <div className="activity-list">{state.logs.slice(0, 2).map((log) => <ActivityRow key={log.id} log={log} />)}</div>
    </section>
  </div>;
}

function StatCard({ label, value, detail, trend, icon: Icon }: { label: string; value: string; detail: string; trend?: string; icon: typeof Send }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><Icon size={15} /></div><div className="stat-value">{value}{trend && <span className="trend">↗ {trend}</span>}</div><p>{detail}</p></div>;
}

function SectionHeader({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return <div className="section-header"><h3>{title}</h3><Button variant="ghost" size="sm" onClick={onClick}>{action}<ChevronRight size={14} /></Button></div>;
}

function AppTargetRow({ app, name, detail, enabled, onToggle }: { app: AppTarget; name: string; detail: string; enabled: boolean; onToggle: () => void }) {
  const Icon = iconForApp(app);
  return <div className="app-row"><div className={`app-logo app-logo-${app}`}><Icon size={20} /></div><div className="row-copy"><p>{name}</p><span>{detail}</span></div><span className={`connected-label ${enabled ? "" : "muted-label"}`}>{enabled ? "Connected" : "Paused"}</span><Switch checked={enabled} onCheckedChange={onToggle} aria-label={`${name} automation`} /></div>;
}

function ActivityRow({ log }: { log: LogEntry }) {
  const Icon = iconForApp(log.app);
  return <div className="activity-row"><div className={`activity-icon activity-${log.app}`}><Icon size={16} /></div><div className="row-copy"><div className="activity-title"><p>{log.sender}</p><span>{log.time.split(" · ")[1]}</span></div><span className="activity-message">{log.message}</span></div><StatusBadge status={log.status} /></div>;
}

function RulesView({ state, setState, setToast }: { state: AppState; setState: Dispatch<SetStateAction<AppState>>; setToast: (message: string) => void }) {
  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const addRule = () => {
    if (!newTrigger.trim() || !newResponse.trim()) { setToast("Add a trigger and reply first"); return; }
    setState((current) => ({ ...current, rules: [...current.rules, { id: createId(), trigger: newTrigger.trim(), response: newResponse.trim(), enabled: true }] }));
    setNewTrigger(""); setNewResponse(""); setToast("Rule added");
  };
  return <div className="space-y-5">
    <section className="section-block prompt-section"><div className="section-header"><div><h3>Assistant persona</h3><p className="section-note">Sets the tone when AI fallback is used.</p></div><Sparkles size={17} className="section-icon" /></div><Textarea value={state.systemPrompt} onChange={(event) => setState((current) => ({ ...current, systemPrompt: event.target.value }))} onBlur={() => setToast("Persona saved locally")} className="prompt-input" /><div className="prompt-footer"><span><LockKeyhole size={12} /> Never leaves this device except in your provider request</span><span>{state.systemPrompt.length}/300</span></div></section>
    <section className="section-block"><div className="section-header"><div><h3>Reply behavior</h3><p className="section-note">Choose what happens when no rule matches.</p></div></div><div className="choice-list"><ChoiceRow icon={Sparkles} title="Ask my AI provider" detail="Use the prompt above for an autonomous reply." active={state.fallback === "ai"} onClick={() => { setState((current) => ({ ...current, fallback: "ai" })); setToast("AI fallback enabled"); }} /><ChoiceRow icon={X} title="Do nothing" detail="Skip messages without a matching rule." active={state.fallback === "skip"} onClick={() => { setState((current) => ({ ...current, fallback: "skip" })); setToast("Fallback disabled"); }} /></div></section>
    <section className="section-block"><div className="section-header"><div><h3>Keyword templates</h3><p className="section-note">Rules run in order, before AI fallback.</p></div><span className="count-chip">{state.rules.length} rules</span></div><div className="rule-list">{state.rules.map((rule) => <RuleRow key={rule.id} rule={rule} onToggle={() => setState((current) => ({ ...current, rules: current.rules.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item) }))} onDelete={() => { setState((current) => ({ ...current, rules: current.rules.filter((item) => item.id !== rule.id) })); setToast("Rule removed"); }} />)}</div><div className="add-rule"><Input value={newTrigger} onChange={(event) => setNewTrigger(event.target.value)} placeholder="Keywords: hi, hello" aria-label="Rule keywords" /><Input value={newResponse} onChange={(event) => setNewResponse(event.target.value)} placeholder="Reply template" aria-label="Rule reply" /><Button size="icon" onClick={addRule} title="Add rule" aria-label="Add rule"><Plus size={17} /></Button></div></section>
  </div>;
}

function ChoiceRow({ icon: Icon, title, detail, active, onClick }: { icon: typeof Sparkles; title: string; detail: string; active: boolean; onClick: () => void }) {
  return <button className={`choice-row ${active ? "choice-active" : ""}`} onClick={onClick}><span className="choice-icon"><Icon size={17} /></span><span className="row-copy"><strong>{title}</strong><span>{detail}</span></span>{active ? <span className="selected-check"><Check size={14} /></span> : <span className="empty-check" />}</button>;
}

function RuleRow({ rule, onToggle, onDelete }: { rule: Rule; onToggle: () => void; onDelete: () => void }) {
  return <div className="rule-row"><div className={`rule-trigger ${rule.enabled ? "" : "rule-disabled"}`}><span className="trigger-label">WHEN</span><span>{rule.trigger}</span></div><ChevronRight size={15} className="rule-arrow" /><div className={`rule-response ${rule.enabled ? "" : "rule-disabled"}`}><span className="trigger-label">REPLY</span><span>{rule.response}</span></div><Switch checked={rule.enabled} onCheckedChange={onToggle} aria-label={`Enable ${rule.trigger} rule`} /><Button variant="ghost" size="icon" className="delete-button" onClick={onDelete} title="Delete rule" aria-label="Delete rule"><Trash2 size={15} /></Button></div>;
}

function SettingsView({ state, updateState, showApiKey, setShowApiKey, connectionState, testConnection, openNotificationSettings, setToast }: { state: AppState; updateState: <K extends keyof AppState>(key: K, value: AppState[K]) => void; showApiKey: boolean; setShowApiKey: (show: boolean) => void; connectionState: "idle" | "testing" | "success" | "error"; testConnection: () => void; openNotificationSettings: () => void; setToast: (message: string) => void }) {
  return <div className="space-y-5">
    <section className="section-block"><div className="section-header"><div><h3>Notification access</h3><p className="section-note">Required for background listening and direct replies.</p></div><ShieldCheck size={17} className="section-icon" /></div><div className="permission-setting"><div className="setting-status"><span className={`status-pip ${state.permissionGranted ? "pip-good" : "pip-warn"}`} /><div><strong>{state.permissionGranted ? "Access enabled" : "Access not enabled"}</strong><span>{state.permissionGranted ? "Study AI can listen for selected apps." : "Open Android settings to grant access."}</span></div></div><Button variant="outline" size="sm" onClick={openNotificationSettings}>{state.permissionGranted ? "Open settings" : "Enable access"}<ChevronRight size={14} /></Button></div></section>
    <section className="section-block"><div className="section-header"><div><h3>AI provider</h3><p className="section-note">OpenAI-compatible endpoint. Stored on this device.</p></div><KeyRound size={17} className="section-icon" /></div><div className="form-stack"><label>Base URL<Input value={state.baseUrl} onChange={(event) => updateState("baseUrl", event.target.value)} placeholder="https://api.openai.com/v1" /></label><label>API key<div className="input-with-action"><Input type={showApiKey ? "text" : "password"} value={state.apiKey} onChange={(event) => updateState("apiKey", event.target.value)} placeholder="sk-••••••••••••"/><Button variant="ghost" size="icon" type="button" onClick={() => setShowApiKey(!showApiKey)} aria-label={showApiKey ? "Hide API key" : "Show API key"} title={showApiKey ? "Hide API key" : "Show API key"}>{showApiKey ? <X size={16} /> : <KeyRound size={16} />}</Button></div></label><label>Model name<Input value={state.model} onChange={(event) => updateState("model", event.target.value)} placeholder="gpt-4o-mini" /></label></div><div className="provider-actions"><Button variant="outline" onClick={testConnection} disabled={connectionState === "testing"}>{connectionState === "testing" ? <RefreshCw size={15} className="spin" /> : connectionState === "success" ? <Check size={15} /> : <Wifi size={15} />}{connectionState === "testing" ? "Testing connection" : connectionState === "success" ? "Connection verified" : "Test connection"}</Button>{connectionState === "error" && <span className="error-note">Could not reach provider</span>}</div></section>
    <section className="section-block"><div className="section-header"><div><h3>Timing & safety</h3><p className="section-note">Keep replies human and avoid accidental spam.</p></div><Clock3 size={17} className="section-icon" /></div><div className="number-grid"><label>Reply delay <div className="number-input"><Input type="number" min="0" max="60" value={state.delay} onChange={(event) => updateState("delay", Number(event.target.value))} /><span>sec</span></div></label><label>Sender cooldown <div className="number-input"><Input type="number" min="1" max="1440" value={state.cooldown} onChange={(event) => updateState("cooldown", Number(event.target.value))} /><span>min</span></div></label></div></section>
    <section className="privacy-note"><LockKeyhole size={17} /><div><strong>Your data stays yours</strong><p>Rules, keys, and message logs are saved locally. Nothing is sent to a server owned by Study AI.</p></div></section>
    <Button variant="ghost" className="reset-button" onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}>Reset all local data</Button>
  </div>;
}

function LogsView({ logs, search, setSearch, filter, setFilter, exportLogs, clearLogs }: { logs: LogEntry[]; search: string; setSearch: (value: string) => void; filter: "all" | AppTarget | LogStatus; setFilter: (value: "all" | AppTarget | LogStatus) => void; exportLogs: () => void; clearLogs: () => void }) {
  return <div className="space-y-5"><div className="logs-toolbar"><div className="search-box"><Search size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages or people" aria-label="Search logs" /></div><Button variant="outline" size="icon" onClick={exportLogs} title="Export logs" aria-label="Export logs"><ArrowDownToLine size={16} /></Button><Button variant="outline" size="icon" onClick={clearLogs} title="Clear logs" aria-label="Clear logs"><Trash2 size={16} /></Button></div><div className="filter-strip"><Filter size={14} /><FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} /><FilterChip label="WhatsApp" active={filter === "whatsapp"} onClick={() => setFilter("whatsapp")} /><FilterChip label="Instagram" active={filter === "instagram"} onClick={() => setFilter("instagram")} /><FilterChip label="AI replies" active={filter === "ai"} onClick={() => setFilter("ai")} /></div><div className="log-timeline">{logs.length ? logs.map((log) => <LogCard key={log.id} log={log} />) : <div className="empty-state"><FileJson size={24} /><p>No matching activity</p><span>Handled messages will appear here.</span></div>}</div></div>;
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <Button variant="ghost" size="sm" className={`filter-chip ${active ? "filter-chip-active" : ""}`} onClick={onClick}>{label}</Button>; }

function LogCard({ log }: { log: LogEntry }) {
  const Icon = iconForApp(log.app);
  return <article className="log-card"><div className="log-card-top"><div className={`activity-icon activity-${log.app}`}><Icon size={15} /></div><div className="log-person"><strong>{log.sender}</strong><span>{log.handle} · {log.time}</span></div><StatusBadge status={log.status} /></div><div className="message-pair"><div><span className="message-label">Received</span><p>{log.message}</p></div><div><span className="message-label">Sent reply</span><p className={log.status === "skipped" ? "skipped-text" : ""}>{log.reply}</p></div></div></article>;
}

function StatusBadge({ status }: { status: LogStatus }) { const labels = { template: "Template", ai: "AI reply", skipped: "Skipped" }; return <span className={`status-badge badge-${status}`}>{status === "template" ? <Zap size={11} /> : status === "ai" ? <Sparkles size={11} /> : <X size={11} />}{labels[status]}</span>; }
