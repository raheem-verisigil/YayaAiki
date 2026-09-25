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
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";
type RouterOutputs = inferRouterOutputs<AppRouter>;
type WorkOrderRow = RouterOutputs["workEngine"]["workOrder"]["listForActor"][number];
type EventRow = RouterOutputs["workEngine"]["event"]["listRecent"][number];

const whatsapp = "https://wa.me/2348112051880?text=Hello%20YayaAiki%2C%20I%27d%20like%20help%20with%20my%20workspace.";

type WorkspaceMode = "business" | "professional" | "ops";

// Real data hooks - replaces the mock arrays above. See docs/PHASE-B-SCOPE.md.
function useRealWorkOrders() {
  return trpc.workEngine.workOrder.listForActor.useQuery();
}
function useRealAllWorkOrders() {
  return trpc.workEngine.workOrder.listAll.useQuery();
}
function useRealEvents(limit = 50) {
  return trpc.workEngine.event.listRecent.useQuery({ limit });
}

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

function fmtAmount(order: WorkOrderRow) {
  const amount = Number(order.priceAmount);
  return `${order.currency} ${amount.toLocaleString()}`;
}

function fmtDate(value: string | Date) {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    CREATED: "Created", FUNDS_RESERVED: "Funds reserved", ACTOR_ASSIGNED: "Actor assigned",
    WORK_STARTED: "Work started", EVIDENCE_SUBMITTED: "Evidence submitted",
    VERIFICATION_PASSED: "In verification", VERIFICATION_FAILED: "Verification failed",
    REWORK_REQUESTED: "Rework requested", PAYMENT_AUTHORIZED: "Payment authorized",
    PAYMENT_CONFIRMED: "Payment confirmed", CLOSED: "Closed", CANCELLED: "Cancelled", DISPUTED: "Disputed",
  };
  return map[status] ?? status;
}

function statusTone(status: string) {
  if (status === "PAYMENT_CONFIRMED") return "green";
  if (status === "REWORK_REQUESTED" || status === "VERIFICATION_FAILED" || status === "DISPUTED") return "coral";
  if (status === "WORK_STARTED" || status === "ACTOR_ASSIGNED") return "gold";
  return "blue";
}

function WorkOrderCard({ item, onSelect }: { item: WorkOrderRow; onSelect: () => void }) {
  const spec = (item.specification ?? {}) as { title?: string };
  const title = spec.title || item.taskType;
  return <button className="work-order-card" onClick={onSelect}><div className="work-order-top"><span className="mono work-id">{item.workOrderId.slice(0, 8)}</span><StatusPill tone={statusTone(item.status)}>{statusLabel(item.status)}</StatusPill></div><h3>{title}</h3><div className="work-order-meta"><span>{item.taskType}</span><span>{item.jurisdiction}</span><span>{fmtAmount(item)}</span></div><div className="work-order-bottom"><span>Created {fmtDate(item.createdAt)}</span><ArrowUpRight size={15} /></div></button>;
}

function BusinessView({ selected, setSelected }: { selected: string | null; setSelected: (id: string | null) => void }) {
  const [showForm, setShowForm] = useState(false);
  const { data: workOrders, isLoading, error } = useRealWorkOrders();
  const list = workOrders ?? [];
  const activeCount = list.filter(o => o.status !== "CLOSED" && o.status !== "CANCELLED").length;
  const fundsReserved = list.reduce((sum, o) => sum + (o.status !== "CLOSED" && o.status !== "CANCELLED" ? Number(o.priceAmount) : 0), 0);
  const verifiedCount = list.filter(o => o.status === "PAYMENT_CONFIRMED").length;
  const selectedOrder = list.find(o => o.workOrderId === selected);
  return <>
    <div className="workspace-toolbar"><div className="toolbar-filter"><Filter size={16} /> All work orders <ChevronDown size={14} /></div><div className="toolbar-actions"><a href={whatsapp} className="button button-outline"><MessageCircle size={16} /> Talk to support</a><button className="button button-accent" onClick={() => setShowForm(!showForm)}><Plus size={17} /> Create work order</button></div></div>
    {showForm && <div className="inline-form"><div><span className="kicker">NEW WORK ORDER</span><h3>What needs to get done?</h3><p>Start with a clear brief. Our team will help you turn it into an accountable workflow.</p></div><div className="form-row"><input placeholder="e.g. Audit 3 retail locations in Lagos" /><button className="button button-dark" onClick={() => { setShowForm(false); toast.success("Brief saved — a YayaAiki coordinator will follow up shortly."); }}>Save brief <Send size={15} /></button></div></div>}
    <div className="workspace-grid stats-grid"><StatCard label="Active work orders" value={String(activeCount).padStart(2, "0")} note="Live count" icon={ClipboardCheck} tone="coral" /><StatCard label="Funds reserved" value={`₦${fundsReserved.toLocaleString()}`} note="Across active work" icon={CircleDollarSign} tone="gold" /><StatCard label="Payment confirmed" value={String(verifiedCount).padStart(2, "0")} note="Completed work orders" icon={ShieldCheck} tone="olive" /><StatCard label="Total work orders" value={String(list.length).padStart(2, "0")} note="All time" icon={Clock3} tone="blue" /></div>
    <div className="workspace-section-head" id="orders"><div><span className="kicker">YOUR WORK ORDERS</span><h2>Everything in one thread.</h2></div><a className="text-link" href="#orders">View all <ArrowUpRight size={15} /></a></div>
    {isLoading && <p>Loading your work orders…</p>}
    {error && <p className="intake-error">Could not load work orders. Please refresh.</p>}
    {!isLoading && !error && list.length === 0 && <div className="attention-card"><div className="section-card-head"><div><span className="kicker">NO WORK ORDERS YET</span><h3>Nothing here yet — that's expected for a new account.</h3></div></div><div className="attention-item"><div><strong>Submit your first request</strong><span>Start with an intake — our team reviews it and converts it into a tracked work order.</span></div><a className="button button-accent" href="/start-work">Start a work order <ArrowUpRight size={16} /></a></div></div>}
    {!isLoading && list.length > 0 && <div className="work-orders-grid">{list.map(item => <WorkOrderCard key={item.workOrderId} item={item} onSelect={() => setSelected(item.workOrderId)} />)}</div>}
    {selected && selectedOrder && <div className="drawer-backdrop" onClick={() => setSelected(null)}><div className="detail-drawer" onClick={e => e.stopPropagation()}><button className="drawer-close" onClick={() => setSelected(null)}><X size={18} /></button><span className="kicker">WORK ORDER DETAIL</span><span className="mono work-id">{selectedOrder.workOrderId.slice(0, 8)}</span><h2>{((selectedOrder.specification ?? {}) as { title?: string }).title || selectedOrder.taskType}</h2><p className="drawer-lede">Status: {statusLabel(selectedOrder.status)} · {fmtAmount(selectedOrder)}</p><button className="button button-dark full-width" onClick={() => setSelected(null)}>Close</button></div></div>}
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
  const { data: events, isLoading: eventsLoading } = useRealEvents(100);
  const { data: allOrders, isLoading: ordersLoading } = useRealAllWorkOrders();
  const confirmPayment = trpc.workEngine.payment.confirmReceived.useMutation();
  const utils = trpc.useUtils();

  const list = events ?? [];
  const filtered = useMemo(() => filter === "All events" ? list : list.filter((e: EventRow) => e.eventType.includes(filter.replace(" events", "").toUpperCase().replace(" ", "_"))), [filter, list]);

  const orders = allOrders ?? [];
  const pendingPayment = orders.filter(o => o.status === "VERIFICATION_PASSED");
  const openCount = orders.filter(o => o.status !== "CLOSED" && o.status !== "CANCELLED").length;
  const awaitingVerification = orders.filter(o => o.status === "EVIDENCE_SUBMITTED").length;
  const totalReserved = orders.reduce((sum, o) => sum + (o.status !== "CLOSED" && o.status !== "CANCELLED" ? Number(o.priceAmount) : 0), 0);

  const handleConfirmPayment = (workOrderId: string) => {
    confirmPayment.mutate({ workOrderId }, {
      onSuccess: () => {
        toast.success("Payment marked as confirmed.");
        utils.workEngine.workOrder.listAll.invalidate();
        utils.workEngine.event.listRecent.invalidate();
      },
      onError: (err) => toast.error(err.message || "Could not confirm payment."),
    });
  };

  return <>
    <div className="ops-banner"><div className="ops-signal"><span /><span /><span /></div><div><span className="kicker">SYSTEM HEALTH</span><h2>The work engine is moving.</h2><p>{openCount} work orders are active. Every consequential action is traceable.</p></div></div>
    <div className="workspace-grid stats-grid"><StatCard label="Open work orders" value={String(openCount).padStart(2, "0")} note="Live count" icon={ClipboardCheck} tone="coral" /><StatCard label="Awaiting verification" value={String(awaitingVerification).padStart(2, "0")} note="Evidence submitted" icon={ShieldCheck} tone="gold" /><StatCard label="Funds reserved" value={`₦${totalReserved.toLocaleString()}`} note="Across open orders" icon={CircleDollarSign} tone="olive" /><StatCard label="System events" value={String(list.length)} note="Append-only · healthy" icon={Activity} tone="blue" /></div>
    <div className="ops-grid">
      <div className="event-card" id="activity">
        <div className="section-card-head"><div><span className="kicker">APPEND-ONLY EVENT HISTORY</span><h3>Every action leaves a trace.</h3></div><div className="event-actions"><button className="toolbar-filter" onClick={() => setFilter(filter === "All events" ? "Evidence events" : "All events")}><Filter size={15} /> {filter} <ChevronDown size={14} /></button></div></div>
        {eventsLoading && <p>Loading events…</p>}
        {!eventsLoading && filtered.length === 0 && <p>No events recorded yet.</p>}
        {!eventsLoading && filtered.length > 0 && <div className="event-table"><div className="event-table-head"><span>EVENT</span><span>ACTOR</span><span>WORK ORDER</span><span>TIME</span></div>{filtered.map((e: EventRow) => <div className="event-row" key={e.eventId}><span><strong>{e.eventType}</strong></span><span className="mono">{e.actorId ? e.actorId.slice(0, 8) : "system"}</span><span className="mono">{e.aggregateId.slice(0, 8)}</span><span className="mono time">{new Date(e.occurredAt).toLocaleString()}</span></div>)}</div>}
      </div>
      <div className="ops-side">
        <div className="queue-card">
          <div className="section-card-head"><div><span className="kicker">PAYMENT QUEUE</span><h3>Verified work awaiting payment confirmation.</h3></div><Clock3 size={18} /></div>
          {ordersLoading && <p>Loading…</p>}
          {!ordersLoading && pendingPayment.length === 0 && <p>Nothing pending — all verified work is paid.</p>}
          {!ordersLoading && pendingPayment.map(o => <div className="queue-item" key={o.workOrderId}><span className="queue-priority high">READY</span><div><strong>{((o.specification ?? {}) as { title?: string }).title || o.taskType}</strong><span>{o.currency} {Number(o.priceAmount).toLocaleString()}</span></div><button onClick={() => handleConfirmPayment(o.workOrderId)} disabled={confirmPayment.isPending}>{confirmPayment.isPending ? "…" : <ArrowUpRight size={15} />}</button></div>)}
        </div>
        <div className="ops-principle"><ShieldCheck size={21} /><div><strong>Verification is independent.</strong><p>Submission and approval are deliberately separated in the control plane.</p></div></div>
      </div>
    </div>
  </>;
}


export default function Workspace({ mode }: { mode: WorkspaceMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  return <div className="workspace-shell"><Sidebar mode={mode} open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="workspace-main"><WorkspaceHeader mode={mode} onMenu={() => setSidebarOpen(true)} /><main className="workspace-content container">{mode === "business" ? <BusinessView selected={selected} setSelected={setSelected} /> : mode === "professional" ? <ProfessionalView selected={selected} setSelected={setSelected} /> : <OpsView />}</main><div className="workspace-footer"><span>YayaAiki internal preview · {mode === "ops" ? "restricted operations surface" : "role-based workspace"}</span><a href={whatsapp}><MessageCircle size={14} /> Need help? WhatsApp us</a></div></div></div>;
}
