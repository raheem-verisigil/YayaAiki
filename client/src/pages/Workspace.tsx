import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Filter,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

const whatsapp = "https://wa.me/2348112051880?text=Hello%20YayaAiki%2C%20I%27d%20like%20help%20with%20my%20workspace.";

type WorkspaceMode = "business" | "professional" | "ops";

const workOrders = [
  { id: "WO-2048", title: "Retail inventory audit", client: "Kora Retail", actor: "Amaka Okafor", location: "Lagos", status: "In verification", statusKey: "verification", amount: "₦180,000", updated: "8 min ago", progress: 78 },
  { id: "WO-2047", title: "Customer support playbook", client: "Sankofa Health", actor: "Tunde Ajayi", location: "Remote", status: "Payment confirmed", statusKey: "paid", amount: "₦95,000", updated: "Yesterday", progress: 100 },
  { id: "WO-2046", title: "Market-entry interviews", client: "Maji Labs", actor: "Aisha Bello", location: "Accra", status: "Rework requested", statusKey: "rework", amount: "₦240,000", updated: "Yesterday", progress: 52 },
  { id: "WO-2045", title: "Data cleanup sprint", client: "Nia Finance", actor: "Chinedu Obi", location: "Remote", status: "Work started", statusKey: "active", amount: "₦120,000", updated: "2 days ago", progress: 34 },
];

const events = [
  { time: "14:03:11", type: "EVIDENCE_SUBMITTED", actor: "Amaka Okafor", order: "WO-2048", detail: "18 artifacts · sha256: 4c8a…a91d", tone: "blue" },
  { time: "13:42:08", type: "WORK_STARTED", actor: "Amaka Okafor", order: "WO-2048", detail: "Location check-in · Lagos", tone: "olive" },
  { time: "09:28:44", type: "ACTOR_ASSIGNED", actor: "Ops / assignment", order: "WO-2048", detail: "Independent actor assigned", tone: "gold" },
  { time: "09:14:26", type: "FUNDS_RESERVED", actor: "Kora Retail", order: "WO-2048", detail: "₦180,000 commitment created", tone: "coral" },
  { time: "08:57:02", type: "WORK_ORDER_CREATED", actor: "Kora Retail", order: "WO-2048", detail: "Policy v1.3 · acceptance set", tone: "purple" },
];

function Brand() { return <Link href="/" className="brand-lockup workspace-brand"><img className="brand-full-logo" src="/yayaaiki-logo.png" alt="YayaAiki — Work, Verified, Valued" /></Link>; }
function StatusPill({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) { return <span className={`status-pill ${tone}`}><span className="status-dot" />{children}</span>; }
function Sidebar({ mode, open, onClose }: { mode: WorkspaceMode; open: boolean; onClose: () => void }) {
  const names = { business: "Kora Retail", professional: "Amaka Okafor", ops: "Operations desk" };
  return <aside className={`workspace-sidebar ${open ? "open" : ""}`}><div className="sidebar-head"><Brand /><button onClick={onClose} className="sidebar-close"><X size={18} /></button></div><div className="sidebar-context"><span className="avatar avatar-coral">{mode === "business" ? "KR" : mode === "professional" ? "AO" : "OP"}</span><div><strong>{names[mode]}</strong><span>{mode === "business" ? "Business workspace" : mode === "professional" ? "Professional workspace" : "Internal operations"}</span></div><ChevronDown size={15} /></div><nav className="workspace-nav"><span className="workspace-nav-label">WORKSPACE</span><a className="active" href="#overview"><LayoutDashboard size={17} /> Overview <span className="nav-count">4</span></a><a href="#orders"><ClipboardCheck size={17} /> Work orders</a><a href="#evidence"><FileCheck2 size={17} /> Evidence</a><a href="#payments"><WalletCards size={17} /> Payments</a><a href="#reputation"><ShieldCheck size={17} /> Reputation</a><span className="workspace-nav-label nav-spacer">OPERATIONS</span><a href="#activity"><Activity size={17} /> Event history</a><a href="#team"><UsersRound size={17} /> Team access</a><a href={whatsapp}><MessageCircle size={17} /> WhatsApp support <ArrowUpRight size={13} /></a></nav><div className="sidebar-bottom"><div className="sidebar-help"><Sparkles size={17} /><div><strong>Need a human?</strong><span>We reply on WhatsApp.</span></div></div><a className="sidebar-footer-link" href={whatsapp}><MessageCircle size={15} /> WhatsApp support</a><Link className="sidebar-footer-link" href="/"><ArrowLeft size={15} /> Back to public site</Link></div></aside>;
}

function WorkspaceHeader({ mode, onMenu }: { mode: WorkspaceMode; onMenu: () => void }) {
  const titles = { business: ["Business portal", "Good morning, Kora Retail"], professional: ["Professional portal", "Good work, Amaka"], ops: ["Operations control plane", "The work engine is moving"] };
  const [title, greeting] = titles[mode];
  return <header className="workspace-header"><button className="workspace-menu" onClick={onMenu}><Menu size={21} /></button><div><span className="workspace-eyebrow">{title}</span><h1>{greeting}</h1></div><div className="workspace-header-actions"><button className="icon-button" title="Search"><Search size={18} /></button><button className="icon-button notification" title="Notifications"><Bell size={18} /><span /></button><div className="workspace-profile"><span className="avatar avatar-dark">{mode === "business" ? "KR" : mode === "professional" ? "AO" : "OP"}</span><ChevronDown size={14} /></div></div></header>;
}

function StatCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: LucideIcon; tone: string }) { return <div className={`stat-card ${tone}`}><div className="stat-card-top"><span>{label}</span><Icon size={19} /></div><strong>{value}</strong><span className="stat-note">{note}</span></div>; }

function WorkOrderCard({ item, onSelect }: { item: typeof workOrders[number]; onSelect: () => void }) { return <button className="work-order-card" onClick={onSelect}><div className="work-order-top"><span className="mono work-id">{item.id}</span><StatusPill tone={item.statusKey === "paid" ? "green" : item.statusKey === "rework" ? "coral" : item.statusKey === "active" ? "gold" : "blue"}>{item.status}</StatusPill></div><h3>{item.title}</h3><div className="work-order-meta"><span>{item.client}</span><span>{item.location}</span><span>{item.amount}</span></div><div className="progress-label"><span>Work order progress</span><span>{item.progress}%</span></div><div className="progress-bar"><span style={{ width: `${item.progress}%` }} /></div><div className="work-order-bottom"><span>Updated {item.updated}</span><ArrowUpRight size={15} /></div></button>; }

function BusinessView({ selected, setSelected }: { selected: string | null; setSelected: (id: string | null) => void }) {
  const [showForm, setShowForm] = useState(false);
  return <>
    <div className="workspace-toolbar"><div className="toolbar-filter"><Filter size={16} /> All work orders <ChevronDown size={14} /></div><div className="toolbar-actions"><a href={whatsapp} className="button button-outline"><MessageCircle size={16} /> Talk to support</a><button className="button button-accent" onClick={() => setShowForm(!showForm)}><Plus size={17} /> Create work order</button></div></div>
    {showForm && <div className="inline-form"><div><span className="kicker">NEW WORK ORDER</span><h3>What needs to get done?</h3><p>Start with a clear brief. Our team will help you turn it into an accountable workflow.</p></div><div className="form-row"><input placeholder="e.g. Audit 3 retail locations in Lagos" /><button className="button button-dark" onClick={() => { setShowForm(false); toast.success("Brief saved — a YayaAiki coordinator will follow up shortly."); }}>Save brief <Send size={15} /></button></div></div>}
    <div className="workspace-grid stats-grid"><StatCard label="Active work orders" value="04" note="2 need your attention" icon={ClipboardCheck} tone="coral" /><StatCard label="Funds reserved" value="₦635k" note="Across active work" icon={CircleDollarSign} tone="gold" /><StatCard label="Verified this month" value="12" note="+28% vs last month" icon={ShieldCheck} tone="olive" /><StatCard label="Average time to proof" value="2.4d" note="Down from 3.1d" icon={Clock3} tone="blue" /></div>
    <div className="workspace-section-head" id="orders"><div><span className="kicker">YOUR WORK ORDERS</span><h2>Everything in one thread.</h2></div><a className="text-link" href="#orders">View all <ArrowUpRight size={15} /></a></div>
    <div className="work-orders-grid">{workOrders.map(item => <WorkOrderCard key={item.id} item={item} onSelect={() => setSelected(item.id)} />)}</div>
    <div className="workspace-lower-grid"><div className="attention-card"><div className="section-card-head"><div><span className="kicker">NEEDS YOUR ATTENTION</span><h3>One decision is waiting.</h3></div><MoreHorizontal size={18} /></div><div className="attention-item"><div className="attention-icon"><FileCheck2 size={19} /></div><div><strong>Review evidence for WO-2048</strong><span>18 artifacts are ready for your acceptance.</span></div><button onClick={() => toast.success("Evidence review opened.")}><ArrowUpRight size={16} /></button></div></div><div className="mini-event-card"><div className="section-card-head"><div><span className="kicker">LATEST ACTIVITY</span><h3>Your proof trail.</h3></div><Activity size={18} /></div><div className="mini-events"><div><span className="mini-event-dot green" /><span><strong>Payment confirmed</strong><small>WO-2047 · Yesterday</small></span></div><div><span className="mini-event-dot blue" /><span><strong>Evidence submitted</strong><small>WO-2048 · 8 min ago</small></span></div><div><span className="mini-event-dot gold" /><span><strong>Actor assigned</strong><small>WO-2045 · 2 days ago</small></span></div></div></div></div>
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><div className="detail-drawer" onClick={e => e.stopPropagation()}><button className="drawer-close" onClick={() => setSelected(null)}><X size={18} /></button><span className="kicker">WORK ORDER DETAIL</span><span className="mono work-id">{selected}</span><h2>Retail inventory audit</h2><p className="drawer-lede">The full evidence and payment thread stays attached to the same work order.</p><div className="drawer-timeline"><div className="drawer-line done"><span><Check size={13} /></span><div><strong>Funds reserved</strong><small>₦180,000 · Kora Retail</small></div></div><div className="drawer-line done"><span><Check size={13} /></span><div><strong>Actor assigned</strong><small>Amaka Okafor · verified professional</small></div></div><div className="drawer-line current"><span><ShieldCheck size={13} /></span><div><strong>Evidence in verification</strong><small>18 files · independent reviewer</small></div></div><div className="drawer-line"><span><WalletCards size={13} /></span><div><strong>Payment authorization</strong><small>Follows a verified pass</small></div></div></div><button className="button button-dark full-width" onClick={() => { setSelected(null); toast.success("Opening the evidence review flow."); }}>Open evidence review <ArrowUpRight size={15} /></button></div></div>}
  </>;
}

function ProfessionalView({ selected, setSelected }: { selected: string | null; setSelected: (id: string | null) => void }) {
  return <>
    <div className="professional-welcome"><div><span className="kicker">YOUR PROFESSIONAL HOME</span><h2>Do the work.<br /><span>Keep the proof.</span></h2><p>Your active briefs, evidence requests, and earned reputation — without the noise.</p></div><div className="reputation-orb"><ShieldCheck size={31} /><strong>4.9</strong><span>verified reputation</span></div></div>
    <div className="workspace-grid stats-grid"><StatCard label="Active assignments" value="02" note="1 due this week" icon={ClipboardCheck} tone="coral" /><StatCard label="Awaiting review" value="01" note="Evidence submitted" icon={Clock3} tone="gold" /><StatCard label="Earned this month" value="₦320k" note="2 payments confirmed" icon={CircleDollarSign} tone="olive" /><StatCard label="Verified outcomes" value="28" note="Across 14 work orders" icon={ShieldCheck} tone="blue" /></div>
    <div className="workspace-section-head" id="orders"><div><span className="kicker">YOUR ASSIGNMENTS</span><h2>Work with a clear finish line.</h2></div><div className="toolbar-filter"><Filter size={16} /> Active <ChevronDown size={14} /></div></div>
    <div className="pro-assignment-list"><button className="pro-assignment featured" onClick={() => setSelected("WO-2048")}><div className="pro-assignment-copy"><div className="work-order-top"><span className="mono work-id">WO-2048</span><StatusPill tone="blue">In verification</StatusPill></div><h3>Retail inventory audit</h3><p>Kora Retail · Lagos · Submit final photo set and count sheet.</p><div className="assignment-tags"><span>Due today</span><span>18 evidence items</span><span>₦180,000 total</span></div></div><div className="assignment-cta"><div className="assignment-ring"><span>78%</span></div><ArrowUpRight size={17} /></div></button><button className="pro-assignment" onClick={() => setSelected("WO-2046")}><div className="pro-assignment-copy"><div className="work-order-top"><span className="mono work-id">WO-2046</span><StatusPill tone="coral">Rework requested</StatusPill></div><h3>Market-entry interviews</h3><p>Maji Labs · Accra · Add two participant consent records.</p><div className="assignment-tags"><span>Due in 3 days</span><span>6 of 8 tasks</span><span>₦240,000 total</span></div></div><div className="assignment-cta"><span className="rework-flag">2 changes</span><ArrowUpRight size={17} /></div></button></div>
    <div className="workspace-lower-grid"><div className="reputation-card"><div className="section-card-head"><div><span className="kicker">REPUTATION, EARNED</span><h3>A record that travels with you.</h3></div><ShieldCheck size={20} /></div><div className="reputation-metrics"><div><strong>28</strong><span>verified outcomes</span></div><div><strong>96%</strong><span>on-time delivery</span></div><div><strong>4.9</strong><span>client trust score</span></div></div><a className="text-link" href="#reputation">View your proof of work <ArrowUpRight size={15} /></a></div><div className="whatsapp-card"><MessageCircle size={22} /><div><h3>Prefer WhatsApp?</h3><p>Get assignment updates and send simple actions on the channel you already use.</p><a href={whatsapp}>Connect WhatsApp <ArrowUpRight size={14} /></a></div></div></div>
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><div className="detail-drawer" onClick={e => e.stopPropagation()}><button className="drawer-close" onClick={() => setSelected(null)}><X size={18} /></button><span className="kicker">YOUR NEXT ACTION</span><span className="mono work-id">{selected}</span><h2>{selected === "WO-2046" ? "Respond to rework" : "Finish the proof set"}</h2><p className="drawer-lede">Keep the work order moving by making the next action explicit.</p><div className="next-action-card"><FileCheck2 size={22} /><div><strong>{selected === "WO-2046" ? "Add 2 participant consent records" : "Submit final photo set and count sheet"}</strong><span>Once submitted, the independent review starts.</span></div></div><button className="button button-accent full-width" onClick={() => { setSelected(null); toast.success("Evidence action saved. The client will be notified."); }}>Continue with evidence <ArrowUpRight size={15} /></button></div></div>}
  </>;
}

function OpsView() {
  const [filter, setFilter] = useState("All events");
  const filtered = useMemo(() => filter === "All events" ? events : events.filter(event => event.type.includes(filter.replace(" events", "").toUpperCase().replace(" ", "_"))), [filter]);
  return <>
    <div className="ops-banner"><div className="ops-signal"><span /><span /><span /></div><div><span className="kicker">SYSTEM HEALTH · ALL CLEAR</span><h2>The work engine is moving.</h2><p>Five work orders are active. Every consequential action is traceable.</p></div><div className="ops-banner-meta"><span>Last event</span><strong>14:03:11 UTC</strong><span>Policy version</span><strong>v1.3</strong></div></div>
    <div className="workspace-grid stats-grid"><StatCard label="Open work orders" value="24" note="+6 since Monday" icon={ClipboardCheck} tone="coral" /><StatCard label="Awaiting verification" value="07" note="2 nearing SLA" icon={ShieldCheck} tone="gold" /><StatCard label="Payment commitments" value="₦2.8m" note="Across 18 orders" icon={CircleDollarSign} tone="olive" /><StatCard label="System events today" value="184" note="Append-only · healthy" icon={Activity} tone="blue" /></div>
    <div className="ops-grid"><div className="event-card" id="activity"><div className="section-card-head"><div><span className="kicker">APPEND-ONLY EVENT HISTORY</span><h3>Every action leaves a trace.</h3></div><div className="event-actions"><button className="toolbar-filter" onClick={() => setFilter(filter === "All events" ? "Evidence events" : "All events")}><Filter size={15} /> {filter} <ChevronDown size={14} /></button><button className="icon-button"><MoreHorizontal size={18} /></button></div></div><div className="event-table"><div className="event-table-head"><span>EVENT</span><span>ACTOR</span><span>WORK ORDER</span><span>DETAIL</span><span>TIME</span></div>{filtered.map((event, index) => <div className="event-row" key={index}><span><span className={`event-tone ${event.tone}`} /><strong>{event.type}</strong></span><span>{event.actor}</span><span className="mono">{event.order}</span><span>{event.detail}</span><span className="mono time">{event.time}</span></div>)}</div><div className="event-card-footer"><span><span className="pulse-dot" /> Live event stream</span><a href="#activity">Export audit view <ArrowUpRight size={14} /></a></div></div><div className="ops-side"><div className="queue-card"><div className="section-card-head"><div><span className="kicker">VERIFICATION QUEUE</span><h3>Make the next call.</h3></div><Clock3 size={18} /></div><div className="queue-item"><span className="queue-priority high">HIGH</span><div><strong>WO-2048 · Retail audit</strong><span>18 evidence items · Lagos</span></div><button onClick={() => toast.success("Opening verification review.")}><ArrowUpRight size={15} /></button></div><div className="queue-item"><span className="queue-priority medium">MED</span><div><strong>WO-2046 · Market interviews</strong><span>Rework response received</span></div><button onClick={() => toast.success("Opening rework review.")}><ArrowUpRight size={15} /></button></div><div className="queue-item"><span className="queue-priority low">LOW</span><div><strong>WO-2042 · Data cleanup</strong><span>Verifier assigned · due tomorrow</span></div><button onClick={() => toast.success("Opening order detail.")}><ArrowUpRight size={15} /></button></div><a className="text-link" href="#activity">Open full queue <ArrowUpRight size={14} /></a></div><div className="ops-principle"><ShieldCheck size={21} /><div><strong>Verification is independent.</strong><p>Submission and approval are deliberately separated in the control plane.</p></div></div></div></div>
  </>;
}

export default function Workspace({ mode }: { mode: WorkspaceMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  return <div className="workspace-shell"><Sidebar mode={mode} open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="workspace-main"><WorkspaceHeader mode={mode} onMenu={() => setSidebarOpen(true)} /><main className="workspace-content container">{mode === "business" ? <BusinessView selected={selected} setSelected={setSelected} /> : mode === "professional" ? <ProfessionalView selected={selected} setSelected={setSelected} /> : <OpsView />}</main><div className="workspace-footer"><span>YayaAiki internal preview · {mode === "ops" ? "restricted operations surface" : "role-based workspace"}</span><a href={whatsapp}><MessageCircle size={14} /> Need help? WhatsApp us</a></div></div></div>;
}
