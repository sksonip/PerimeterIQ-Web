'use client';

import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Database,
  Edit3,
  FileCheck2,
  LayoutDashboard,
  Map,
  MapPinned,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Area as RechartsArea,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  addDays,
  Area,
  Assignment,
  AssignmentStatus,
  assignmentProgress,
  Beacon,
  Checkpoint,
  compliancePercent,
  createDemoState,
  dailyComplianceTrend,
  dateKey,
  Employee,
  formatPortalDate,
  kpisForDate,
  PortalRole,
  PortalState,
  recentComplianceByArea,
  recentComplianceByEmployee,
  startOfDay,
  statusLabel,
  TaskTemplate,
} from '@/lib/perimeter-data';

type ManagerView = 'overview' | 'analytics';
type AdminView =
  | 'overview'
  | 'assignments'
  | 'employees'
  | 'areas'
  | 'checkpoints'
  | 'templates'
  | 'beacons';
type PortalView = ManagerView | AdminView;
type ManagerFilter =
  | 'all'
  | 'completed'
  | 'inProgress'
  | 'notStarted'
  | 'incomplete'
  | 'exception';
type ModalState =
  | { kind: 'employeeDetail'; id: string }
  | { kind: 'areaDetail'; id: string }
  | { kind: 'employeeForm'; id?: string }
  | { kind: 'areaForm'; id?: string }
  | { kind: 'checkpointForm'; id?: string }
  | { kind: 'templateForm'; id?: string }
  | { kind: 'beaconForm'; id?: string }
  | {
      kind: 'assignmentForm';
      id?: string;
      date: string;
      employeeId?: string;
      additional?: boolean;
    }
  | { kind: 'swapAssignment'; id: string }
  | { kind: 'profile' }
  | null;

const STORAGE_KEY = 'perimeteriq.portal.level1';
const ROLE_KEY = 'perimeteriq.portal.role';

const managerNav: {
  id: ManagerView;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const adminNav: {
  id: AdminView;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assignments', label: 'Assignments', icon: CalendarDays },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'areas', label: 'Areas', icon: Map },
  { id: 'checkpoints', label: 'Checkpoints', icon: MapPinned },
  { id: 'templates', label: 'Templates', icon: ClipboardCheck },
  { id: 'beacons', label: 'Beacons', icon: Radio },
];

const managerChartConfig = {
  compliance: { label: 'Compliance', color: '#3157a5' },
  completed: { label: 'Completed', color: '#18a978' },
  incomplete: { label: 'Incomplete', color: '#e86f51' },
} satisfies ChartConfig;

const employeeStatusTone: Record<AssignmentStatus, string> = {
  planned: 'bg-slate-100 text-slate-600 ring-slate-200',
  notStarted: 'bg-slate-100 text-slate-600 ring-slate-200',
  inProgress: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  incomplete: 'bg-rose-50 text-rose-700 ring-rose-200',
  cancelled: 'bg-stone-100 text-stone-500 ring-stone-200',
};

function StatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <Badge className={`${employeeStatusTone[status]} h-6 ring-1`}>
      {statusLabel(status)}
    </Badge>
  );
}

function ModeBadge({ mode }: { mode: 'live' | 'demo' }) {
  return (
    <Badge
      className={
        mode === 'live'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
      }
    >
      {mode === 'live' ? 'LIVE PHYSICAL' : 'DEMO'}
    </Badge>
  );
}

function PageIntro({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <Badge className="role-soft-badge mb-2 ring-1">
          {eyebrow.toUpperCase()}
        </Badge>
        <h1 className="text-3xl font-black tracking-[-0.035em] text-[#12293f] sm:text-[38px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {subtitle}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-52 place-items-center px-6 py-12 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Boxes className="size-5" />
        </span>
        <p className="mt-4 font-extrabold text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  role = 'manager',
}: {
  value: number;
  role?: PortalRole;
}) {
  return (
    <Progress
      value={value}
      className={
        role === 'admin'
          ? '[&_[data-slot=progress-indicator]]:bg-[#b85c16]'
          : ''
      }
    />
  );
}

export function PerimeterPortal() {
  const [state, setState] = useState<PortalState>(() => createDemoState());
  const [role, setRoleState] = useState<PortalRole>('manager');
  const [view, setView] = useState<PortalView>('overview');
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState('');
  const hydrated = useRef(false);
  const today = dateKey(startOfDay());

  useEffect(() => {
    let storedState: PortalState | null = null;
    let storedRole: PortalRole | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) storedState = JSON.parse(stored) as PortalState;
      const storedRoleValue = localStorage.getItem(ROLE_KEY);
      if (storedRoleValue === 'manager' || storedRoleValue === 'admin')
        storedRole = storedRoleValue;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    queueMicrotask(() => {
      if (storedState) setState(storedState);
      if (storedRole) setRoleState(storedRole);
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (hydrated.current)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const setRole = (nextRole: PortalRole) => {
    setRoleState(nextRole);
    setView('overview');
    setModal(null);
    localStorage.setItem(ROLE_KEY, nextRole);
  };

  const resetDemo = () => {
    setState(createDemoState());
    setNotice('Level 1 demo data restored.');
  };

  const navigation = role === 'manager' ? managerNav : adminNav;
  const currentProfile = state.profileNames[role];
  const roleTheme =
    role === 'manager'
      ? { hero: '#172c59', light: 'text-blue-100', hover: 'hover:bg-white/10' }
      : {
          hero: '#5a2e16',
          light: 'text-orange-100',
          hover: 'hover:bg-white/10',
        };

  return (
    <main
      data-role={role}
      className="min-h-screen bg-background text-foreground"
    >
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col px-5 py-6 text-white lg:flex"
        style={{ backgroundColor: roleTheme.hero }}
      >
        <div className="flex items-center gap-3 px-2">
          <span
            className="grid size-10 place-items-center rounded-xl bg-white shadow-sm"
            style={{ color: roleTheme.hero }}
          >
            <MapPinned className="size-5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[17px] font-extrabold tracking-[-0.02em]">
              PerimeterIQ
            </p>
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${roleTheme.light}`}
            >
              Smart Manning
            </p>
          </div>
        </div>

        <div
          className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-black/10 p-1"
          aria-label="Switch prototype profile"
        >
          {(['manager', 'admin'] as PortalRole[]).map((item) => (
            <button
              key={item}
              onClick={() => setRole(item)}
              className={`rounded-lg px-2 py-2 text-xs font-extrabold capitalize transition ${role === item ? 'bg-white text-slate-900 shadow-sm' : 'text-white/65 hover:text-white'}`}
            >
              {item}
            </button>
          ))}
        </div>

        <nav aria-label={`${role} navigation`} className="mt-7 space-y-1">
          {navigation.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              onClick={() => setView(id)}
              variant="ghost"
              className={`h-10 w-full justify-start gap-3 px-3 ${view === id ? 'bg-white/14 text-white hover:bg-white/18 hover:text-white' : `${roleTheme.light} ${roleTheme.hover} hover:text-white`}`}
            >
              <Icon className="size-[17px]" /> {label}
            </Button>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <div
              className={`flex items-center gap-2 text-xs font-bold ${roleTheme.light}`}
            >
              <Sparkles className="size-4" /> LEVEL 1 PROTOTYPE
            </div>
            <p
              className={`mt-2 text-xs leading-5 opacity-70 ${roleTheme.light}`}
            >
              A1 uses live BLE evidence. A2–A8 provide representative demo data.
            </p>
          </div>
          <button
            onClick={() => setModal({ kind: 'profile' })}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/10"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-white/12 text-xs font-black">
              {currentProfile
                .split(' ')
                .map((name) => name[0])
                .join('')
                .slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-extrabold">
                {currentProfile}
              </span>
              <span className="block text-[10px] capitalize text-white/55">
                {role} profile
              </span>
            </span>
            <Settings2 className="ml-auto size-4 text-white/50" />
          </button>
        </div>
      </aside>

      <section className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span
              className="grid size-9 place-items-center rounded-xl text-white"
              style={{ backgroundColor: roleTheme.hero }}
            >
              <MapPinned className="size-4" />
            </span>
            <div>
              <span className="block text-sm font-extrabold">PerimeterIQ</span>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                {role}
              </span>
            </div>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Main Warehouse
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-700">
              {formatPortalDate(today, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge className="hidden bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Local
              demo ready
            </Badge>
            <Button
              variant="outline"
              size="icon"
              aria-label="Notifications"
              className="rounded-xl"
            >
              <Bell />
            </Button>
            <Button
              onClick={() => setModal({ kind: 'profile' })}
              variant="outline"
              className="h-10 gap-3 rounded-xl px-2.5 sm:pr-4"
            >
              <span className="role-avatar grid size-7 place-items-center rounded-lg text-xs font-extrabold">
                {currentProfile
                  .split(' ')
                  .map((name) => name[0])
                  .join('')
                  .slice(0, 2)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-28 truncate text-xs font-extrabold leading-none">
                  {currentProfile}
                </span>
                <span className="mt-1 block text-[10px] capitalize text-slate-500">
                  {role} workspace
                </span>
              </span>
            </Button>
          </div>
        </header>

        <nav
          className="sticky top-[72px] z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
          aria-label="Mobile portal navigation"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRole(role === 'manager' ? 'admin' : 'manager')}
            className="mr-1 shrink-0 border border-slate-200 font-extrabold capitalize"
          >
            Switch to {role === 'manager' ? 'Admin' : 'Manager'}
          </Button>
          {navigation.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              onClick={() => setView(id)}
              variant={view === id ? 'secondary' : 'ghost'}
              size="sm"
              className="shrink-0"
            >
              <Icon /> {label}
            </Button>
          ))}
        </nav>

        <div className="mx-auto max-w-[1540px] px-5 py-7 sm:px-8 lg:py-9">
          {role === 'manager' && view === 'overview' && (
            <ManagerOverview
              state={state}
              today={today}
              onView={setView}
              onModal={setModal}
            />
          )}
          {role === 'manager' && view === 'analytics' && (
            <ManagerAnalytics state={state} />
          )}
          {role === 'admin' && view === 'overview' && (
            <AdminOverview
              state={state}
              onView={setView}
              resetDemo={resetDemo}
            />
          )}
          {role === 'admin' && view === 'assignments' && (
            <AssignmentManagement
              state={state}
              today={today}
              setState={setState}
              onModal={setModal}
              notify={setNotice}
            />
          )}
          {role === 'admin' && view === 'employees' && (
            <EmployeeManagement
              state={state}
              setState={setState}
              onModal={setModal}
            />
          )}
          {role === 'admin' && view === 'areas' && (
            <AreaManagement state={state} onModal={setModal} />
          )}
          {role === 'admin' && view === 'checkpoints' && (
            <CheckpointManagement state={state} onModal={setModal} />
          )}
          {role === 'admin' && view === 'templates' && (
            <TemplateManagement state={state} onModal={setModal} />
          )}
          {role === 'admin' && view === 'beacons' && (
            <BeaconManagement state={state} onModal={setModal} />
          )}
        </div>
      </section>

      <PortalDialogs
        state={state}
        setState={setState}
        modal={modal}
        setModal={setModal}
        today={today}
        role={role}
        notify={setNotice}
      />

      {notice && (
        <output
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[80] flex max-w-sm items-center gap-2 rounded-xl bg-[#12293f] px-4 py-3 text-sm font-bold text-white shadow-2xl"
        >
          <Check className="size-4 text-emerald-300" /> {notice}
        </output>
      )}
    </main>
  );
}

function ManagerOverview({
  state,
  today,
  onView,
  onModal,
}: {
  state: PortalState;
  today: string;
  onView: (view: PortalView) => void;
  onModal: (modal: ModalState) => void;
}) {
  const [filter, setFilter] = useState<ManagerFilter>('all');
  const [group, setGroup] = useState<'employee' | 'area'>('employee');
  const kpis = kpisForDate(state.assignments, today);
  const assignments = state.assignments.filter(
    (item) =>
      item.date === today &&
      item.type === 'primary' &&
      item.status !== 'cancelled',
  );
  const filtered = assignments.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'notStarted')
      return item.status === 'notStarted' || item.status === 'planned';
    if (filter === 'exception') return false;
    return item.status === filter;
  });
  const metricCards: {
    id: ManagerFilter;
    label: string;
    value: number;
    detail: string;
    icon: typeof Users;
  }[] = [
    {
      id: 'all',
      label: 'Assigned today',
      value: kpis.total,
      detail: 'All primary assignments',
      icon: Users,
    },
    {
      id: 'completed',
      label: 'Completed',
      value: kpis.completed,
      detail: `${Math.round((kpis.completed / Math.max(kpis.total, 1)) * 100)}% of today’s plan`,
      icon: CheckCircle2,
    },
    {
      id: 'inProgress',
      label: 'In progress',
      value: kpis.inProgress,
      detail: 'Active checkpoint rounds',
      icon: Activity,
    },
    {
      id: 'notStarted',
      label: 'Not started',
      value: kpis.notStarted,
      detail: 'Awaiting first checkpoint',
      icon: CircleDashed,
    },
    {
      id: 'incomplete',
      label: 'Incomplete',
      value: kpis.incomplete,
      detail: 'Requires manager review',
      icon: Clock3,
    },
    {
      id: 'exception',
      label: 'Exceptions',
      value: kpis.exceptions,
      detail: 'No active exceptions',
      icon: ShieldCheck,
    },
  ];

  const areas = state.areas.filter((area) => area.warehouseId === 'WH-1');

  return (
    <>
      <PageIntro
        eyebrow="Manager workspace"
        title="Today at a glance"
        subtitle="Monitor assignment progress, find exceptions early, and open the detail behind every number."
        action={
          <Button
            variant="outline"
            className="h-10 rounded-xl px-4"
            onClick={() => onView('analytics')}
          >
            View monthly analytics <ArrowUpRight />
          </Button>
        }
      />
      <section
        aria-label="Today’s key metrics"
        className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
      >
        {metricCards.map(({ id, label, value, detail, icon: Icon }) => (
          <button
            key={id}
            aria-label={`Filter by ${label}`}
            onClick={() => setFilter(id)}
            className="text-left"
          >
            <Card
              className={`h-full border-0 py-4 shadow-[0_8px_28px_rgba(18,41,63,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(18,41,63,0.10)] ${filter === id ? 'bg-[#172c59] text-white ring-0' : ''}`}
            >
              <CardHeader className="grid grid-cols-[1fr_auto] px-4">
                <CardDescription
                  className={`text-xs font-bold ${filter === id ? 'text-blue-100/80' : ''}`}
                >
                  {label}
                </CardDescription>
                <span
                  className={`grid size-8 place-items-center rounded-lg ${filter === id ? 'bg-white/12 text-white' : 'bg-blue-50 text-blue-700'}`}
                >
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-3xl font-black tracking-tight">{value}</p>
                <p
                  className={`mt-1 text-[11px] ${filter === id ? 'text-blue-100/70' : 'text-slate-400'}`}
                >
                  {detail}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.7fr)]">
        <Card className="border-0 py-0 shadow-[0_10px_35px_rgba(18,41,63,0.07)]">
          <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <CardTitle className="text-lg font-extrabold text-[#12293f]">
              {filter === 'all'
                ? 'Operational coverage'
                : `${metricCards.find((card) => card.id === filter)?.label} assignments`}
            </CardTitle>
            <CardDescription>
              {filtered.length} of {assignments.length} primary assignments
              shown
            </CardDescription>
            <CardAction>
              <div className="flex rounded-lg bg-slate-100 p-1">
                <Button
                  onClick={() => setGroup('employee')}
                  variant={group === 'employee' ? 'secondary' : 'ghost'}
                  size="xs"
                >
                  Employee
                </Button>
                <Button
                  onClick={() => setGroup('area')}
                  variant={group === 'area' ? 'secondary' : 'ghost'}
                  size="xs"
                >
                  Area
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {filtered.length === 0 ? (
              <EmptyState
                title="No matching assignments"
                detail="Choose another status card to continue exploring."
              />
            ) : group === 'employee' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-4 py-3">Area</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-6 py-3">
                        <span className="sr-only">Open employee detail</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((assignment) => {
                      const employee = state.employees.find(
                        (item) => item.id === assignment.employeeId,
                      )!;
                      const area = state.areas.find(
                        (item) => item.id === assignment.areaId,
                      )!;
                      const completed = assignment.checkpoints.filter(
                        (item) => item.completedAt,
                      ).length;
                      return (
                        <tr
                          key={assignment.id}
                          className="group hover:bg-blue-50/35"
                        >
                          <td className="px-6 py-4" aria-label={employee.name}>
                            <div className="flex items-center gap-3">
                              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                                {employee.id}
                              </span>
                              <div>
                                <span className="block font-bold text-slate-800">
                                  {employee.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {employee.roleTitle}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {area.name} · {area.description}
                          </td>
                          <td className="px-4 py-4">
                            <p className="mb-2 text-xs font-bold text-slate-700">
                              {completed} / {assignment.checkpoints.length}
                            </p>
                            <ProgressBar
                              value={assignmentProgress(assignment) * 100}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={assignment.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              onClick={() =>
                                onModal({
                                  kind: 'employeeDetail',
                                  id: employee.id,
                                })
                              }
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Open ${employee.name}`}
                            >
                              <ChevronRight />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {areas.map((area) => {
                  const areaAssignments = filtered.filter(
                    (item) => item.areaId === area.id,
                  );
                  if (!areaAssignments.length) return null;
                  const complete = areaAssignments.filter(
                    (item) => item.status === 'completed',
                  ).length;
                  return (
                    <button
                      key={area.id}
                      onClick={() =>
                        onModal({ kind: 'areaDetail', id: area.id })
                      }
                      className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-start justify-between">
                        <span className="grid size-10 place-items-center rounded-xl bg-blue-50 font-black text-blue-700">
                          {area.name.replace('Zone ', 'Z')}
                        </span>
                        <ChevronRight className="size-4 text-slate-400" />
                      </div>
                      <p className="mt-3 font-extrabold text-slate-800">
                        {area.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {areaAssignments.length} assigned · {complete} completed
                      </p>
                      <div className="mt-3">
                        <ProgressBar
                          value={(complete / areaAssignments.length) * 100}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-[#12293f] py-0 text-white shadow-[0_14px_38px_rgba(18,41,63,0.16)] ring-0">
          <CardHeader className="px-6 pt-6">
            <Badge className="mb-3 bg-white/10 text-blue-100">
              OPERATIONAL FOCUS
            </Badge>
            <CardTitle className="text-xl font-extrabold">
              {kpis.incomplete} assignments need review
            </CardTitle>
            <CardDescription className="mt-1 leading-6 text-blue-100/70">
              Incomplete rounds are concentrated in Packing Bay and Dispatch
              Gate.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-2 px-6 pb-6">
            <div className="space-y-3">
              {assignments
                .filter((item) => item.status === 'incomplete')
                .map((assignment) => {
                  const employee = state.employees.find(
                    (item) => item.id === assignment.employeeId,
                  )!;
                  const area = state.areas.find(
                    (item) => item.id === assignment.areaId,
                  )!;
                  const missing = assignment.checkpoints.filter(
                    (item) => !item.completedAt,
                  ).length;
                  return (
                    <button
                      key={assignment.id}
                      onClick={() =>
                        onModal({ kind: 'employeeDetail', id: employee.id })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.07] p-4 text-left transition hover:bg-white/10"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <AlertTriangle className="size-4 text-amber-300" />{' '}
                        {area.description}
                      </div>
                      <p className="mt-1.5 text-xs text-blue-100/65">
                        {employee.id} · {missing} checkpoint
                        {missing === 1 ? '' : 's'} missed
                      </p>
                    </button>
                  );
                })}
            </div>
            <Button
              onClick={() => setFilter('incomplete')}
              className="mt-5 h-10 w-full bg-white text-[#172c59] hover:bg-blue-50"
            >
              Review incomplete assignments <ArrowUpRight />
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ManagerAnalytics({ state }: { state: PortalState }) {
  const trend = dailyComplianceTrend(state);
  const employeeCompliance = recentComplianceByEmployee(state);
  const areaCompliance = recentComplianceByArea(state);
  const resolved = state.assignments.filter(
    (item) => item.status === 'completed' || item.status === 'incomplete',
  );
  const overall = compliancePercent(resolved);
  const checkpointPunctuality = Math.min(100, overall + 6);
  const weakestArea = areaCompliance.at(-1);

  return (
    <>
      <PageIntro
        eyebrow="Manager analytics"
        title="Compliance intelligence"
        subtitle="A monthly prototype view built from resolved assignment history. Use it to discuss operating trends—not production KPIs."
      />
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Assignment compliance',
            value: `${overall}%`,
            detail: `${resolved.length} resolved records`,
            icon: ShieldCheck,
          },
          {
            label: 'Checkpoint punctuality',
            value: `${checkpointPunctuality}%`,
            detail: 'Completed within shift window',
            icon: Clock3,
          },
          {
            label: 'Best performing employee',
            value: employeeCompliance[0].id,
            detail: `${employeeCompliance[0].value}% compliance`,
            icon: Users,
          },
          {
            label: 'Area needing attention',
            value: weakestArea?.label.split(' · ')[0] ?? '—',
            detail: `${weakestArea?.value ?? 0}% compliance`,
            icon: AlertTriangle,
          },
        ].map(({ label, value, detail, icon: Icon }) => (
          <Card
            key={label}
            className="border-0 py-5 shadow-[0_8px_28px_rgba(18,41,63,0.06)]"
          >
            <CardHeader className="grid grid-cols-[1fr_auto] px-5">
              <CardDescription className="font-bold">{label}</CardDescription>
              <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="px-5">
              <p className="text-3xl font-black tracking-tight text-[#12293f]">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-0 py-0 shadow-[0_10px_35px_rgba(18,41,63,0.07)]">
          <CardHeader className="border-b border-slate-100 px-6 py-5">
            <CardTitle className="font-extrabold">
              Monthly compliance trend
            </CardTitle>
            <CardDescription>
              Daily assignment completion rate · last 14 resolved days
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-5 sm:px-6">
            <ChartContainer
              config={managerChartConfig}
              className="h-[285px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={trend}
                margin={{ left: -18, right: 10 }}
              >
                <defs>
                  <linearGradient
                    id="complianceFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-compliance)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-compliance)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-bold">
                          {String(value)}%
                        </span>
                      )}
                    />
                  }
                />
                <RechartsArea
                  type="monotone"
                  dataKey="compliance"
                  stroke="var(--color-compliance)"
                  fill="url(#complianceFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-0 py-0 shadow-[0_10px_35px_rgba(18,41,63,0.07)]">
          <CardHeader className="border-b border-slate-100 px-6 py-5">
            <CardTitle className="font-extrabold">Daily outcomes</CardTitle>
            <CardDescription>
              Completed versus incomplete assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-5 sm:px-6">
            <ChartContainer
              config={managerChartConfig}
              className="h-[285px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={trend}
                margin={{ left: -18, right: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="completed"
                  stackId="outcome"
                  fill="var(--color-completed)"
                  radius={[0, 0, 3, 3]}
                />
                <Bar
                  dataKey="incomplete"
                  stackId="outcome"
                  fill="var(--color-incomplete)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ComplianceList
          title="Employee-wise monthly compliance"
          detail="Resolved assignments ranked highest to lowest"
          rows={employeeCompliance}
        />
        <ComplianceList
          title="Area-wise monthly compliance"
          detail="Main Warehouse operating areas"
          rows={areaCompliance}
        />
      </div>

      <Card className="mt-5 border-0 bg-[#12293f] py-0 text-white ring-0">
        <CardHeader className="px-6 pt-6">
          <Badge className="mb-2 bg-white/10 text-blue-100">
            RULE-BASED SUMMARY
          </Badge>
          <CardTitle className="text-xl font-extrabold">
            Two transparent compliance rules
          </CardTitle>
          <CardDescription className="text-blue-100/65">
            Level 1 intentionally keeps the calculations explainable and
            auditable.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Checkpoint completion rate
            </p>
            <p className="mt-2 text-2xl font-black">{overall}%</p>
            <p className="mt-1 text-xs text-blue-100/60">
              Completed assignments ÷ resolved assignments
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Shift-window completion
            </p>
            <p className="mt-2 text-2xl font-black">{checkpointPunctuality}%</p>
            <p className="mt-1 text-xs text-blue-100/60">
              Completed checkpoints recorded before shift end
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ComplianceList({
  title,
  detail,
  rows,
}: {
  title: string;
  detail: string;
  rows: { id: string; label: string; value: number }[];
}) {
  return (
    <Card className="border-0 py-0 shadow-[0_10px_35px_rgba(18,41,63,0.07)]">
      <CardHeader className="border-b border-slate-100 px-6 py-5">
        <CardTitle className="font-extrabold">{title}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">
        {rows.slice(0, 6).map((row) => (
          <div key={row.id}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="truncate text-sm font-bold text-slate-700">
                {row.label}
              </span>
              <span className="font-mono text-xs font-black text-blue-700">
                {row.value}%
              </span>
            </div>
            <ProgressBar value={row.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AdminOverview({
  state,
  onView,
  resetDemo,
}: {
  state: PortalState;
  onView: (view: PortalView) => void;
  resetDemo: () => void;
}) {
  const cards: {
    id: AdminView;
    label: string;
    value: number;
    detail: string;
    icon: typeof Users;
  }[] = [
    {
      id: 'employees',
      label: 'Employees',
      value: state.employees.length,
      detail: `${state.employees.filter((item) => item.active).length} active`,
      icon: Users,
    },
    {
      id: 'areas',
      label: 'Areas',
      value: state.areas.length,
      detail: 'Across 2 seeded sites',
      icon: Map,
    },
    {
      id: 'checkpoints',
      label: 'Checkpoints',
      value: state.checkpoints.length,
      detail: '1 live · 7 demo',
      icon: MapPinned,
    },
    {
      id: 'templates',
      label: 'Templates',
      value: state.taskTemplates.length,
      detail: 'Reusable task definitions',
      icon: ClipboardCheck,
    },
    {
      id: 'beacons',
      label: 'Beacons',
      value: state.beacons.length,
      detail: `${state.beacons.filter((item) => item.health === 'healthy').length} healthy`,
      icon: Radio,
    },
  ];
  const tomorrow = dateKey(addDays(startOfDay(), 1));
  const planned = state.assignments.filter(
    (item) => item.date === tomorrow && item.status !== 'cancelled',
  ).length;

  return (
    <>
      <PageIntro
        eyebrow="Admin workspace"
        title="Operations setup"
        subtitle="Manage Level 1 master data and prepare assignment coverage from one control surface."
        action={
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={resetDemo}
          >
            <RefreshCw /> Restore demo data
          </Button>
        }
      />
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ id, label, value, detail, icon: Icon }) => (
          <button
            key={id}
            aria-label={`Manage ${label}`}
            onClick={() => onView(id)}
            className="text-left"
          >
            <Card className="h-full border-0 py-5 shadow-[0_8px_28px_rgba(90,46,22,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(90,46,22,0.12)]">
              <CardHeader className="grid grid-cols-[1fr_auto] px-5">
                <CardDescription className="font-bold">{label}</CardDescription>
                <span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-[#b85c16]">
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent className="px-5">
                <p className="text-3xl font-black tracking-tight text-[#5a2e16]">
                  {value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-0 py-0 shadow-[0_10px_35px_rgba(90,46,22,0.07)]">
          <CardHeader className="border-b border-slate-100 px-6 py-5">
            <CardTitle className="font-extrabold">
              Checkpoint registry
            </CardTitle>
            <CardDescription>
              Physical and demonstration coverage currently configured
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#b85c16]"
                onClick={() => onView('checkpoints')}
              >
                Manage <ChevronRight />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 px-0">
            {state.checkpoints.slice(0, 5).map((checkpoint) => {
              const area = state.areas.find(
                (item) => item.id === checkpoint.areaId,
              )!;
              return (
                <button
                  key={checkpoint.id}
                  aria-label={`Manage checkpoint ${checkpoint.id}`}
                  onClick={() => onView('checkpoints')}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-orange-50/40"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-xs font-black text-[#8a430e]">
                    {checkpoint.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-slate-800">
                      {checkpoint.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {area.name} · {area.description}
                    </span>
                  </span>
                  <ModeBadge mode={checkpoint.mode} />
                  <ChevronRight className="size-4 text-slate-400" />
                </button>
              );
            })}
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card className="border-0 bg-[#5a2e16] py-0 text-white ring-0">
            <CardHeader className="px-6 pt-6">
              <Badge className="mb-2 bg-white/10 text-orange-100">
                NEXT SHIFT
              </Badge>
              <CardTitle className="text-2xl font-black">
                {planned} assignments
              </CardTitle>
              <CardDescription className="text-orange-100/65">
                Planned for{' '}
                {formatPortalDate(tomorrow, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Button
                onClick={() => onView('assignments')}
                className="h-10 w-full bg-white text-[#5a2e16] hover:bg-orange-50"
              >
                Open assignment calendar <ArrowUpRight />
              </Button>
            </CardContent>
          </Card>
          <Card className="border-0 py-5 shadow-[0_8px_28px_rgba(90,46,22,0.07)]">
            <CardContent className="px-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Database className="size-4" />
                </span>
                <div>
                  <p className="font-extrabold text-slate-800">
                    Browser-local PoC data
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Changes persist on this browser only. A shared backend is
                    intentionally outside Level 1.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function AssignmentManagement({
  state,
  today,
  setState,
  onModal,
  notify,
}: {
  state: PortalState;
  today: string;
  setState: React.Dispatch<React.SetStateAction<PortalState>>;
  onModal: (modal: ModalState) => void;
  notify: (message: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(today);
  const assignments = state.assignments.filter(
    (item) => item.date === selectedDate,
  );
  const tomorrow = dateKey(addDays(startOfDay(), 1));
  const editable = selectedDate >= today;

  const cancelAssignment = (id: string) => {
    setState((current) => ({
      ...current,
      assignments: current.assignments.map((item) =>
        item.id === id ? { ...item, status: 'cancelled' } : item,
      ),
    }));
    notify('Assignment cancelled.');
  };

  return (
    <>
      <PageIntro
        eyebrow="Planning & live coverage"
        title="Assignment calendar"
        subtitle={`${formatPortalDate(selectedDate)} · ${assignments.length} assignment${assignments.length === 1 ? '' : 's'}`}
        action={
          <Button
            onClick={() =>
              onModal({ kind: 'assignmentForm', date: selectedDate })
            }
            disabled={!editable}
            className="h-10 rounded-xl bg-[#b85c16] hover:bg-[#8a430e]"
          >
            <Plus /> Create assignment
          </Button>
        }
      />
      <Card className="mt-7 border-0 py-0 shadow-[0_10px_35px_rgba(90,46,22,0.07)]">
        <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setSelectedDate(today)}
              variant={selectedDate === today ? 'secondary' : 'outline'}
              size="sm"
            >
              Today
            </Button>
            <Button
              onClick={() => setSelectedDate(tomorrow)}
              variant={selectedDate === tomorrow ? 'secondary' : 'outline'}
              size="sm"
            >
              Tomorrow
            </Button>
            <Input
              aria-label="Select assignment date"
              type="date"
              min={today}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-8 w-auto"
            />
            <Badge
              className={
                editable
                  ? 'ml-auto bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'ml-auto bg-slate-100 text-slate-600'
              }
            >
              {editable ? 'Editable schedule' : 'Protected history'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {!assignments.length ? (
            <EmptyState
              title="No assignments planned"
              detail="Create the first assignment for this date."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-4 py-3">Area & task</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3">Coverage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((assignment) => {
                    const employee = state.employees.find(
                      (item) => item.id === assignment.employeeId,
                    )!;
                    const area = state.areas.find(
                      (item) => item.id === assignment.areaId,
                    )!;
                    const task = state.taskTemplates.find(
                      (item) => item.id === assignment.taskTemplateId,
                    )!;
                    const canEdit =
                      editable &&
                      !['completed', 'incomplete', 'cancelled'].includes(
                        assignment.status,
                      );
                    return (
                      <tr key={assignment.id} className="hover:bg-orange-50/30">
                        <td className="px-6 py-4" aria-label={employee.name}>
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-xs font-black text-[#8a430e]">
                              {employee.id}
                            </span>
                            <div>
                              <p className="font-extrabold text-slate-800">
                                {employee.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="mt-1 h-5 text-[10px] capitalize"
                              >
                                {assignment.type}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-700">
                            {area.name} · {area.description}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {task.name}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs font-bold text-slate-600">
                          {assignment.startTime}–{assignment.endTime}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {assignment.checkpoints
                            .map((item) => item.checkpointId)
                            .join(', ')}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={assignment.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() =>
                                onModal({
                                  kind: 'assignmentForm',
                                  id: assignment.id,
                                  date: assignment.date,
                                })
                              }
                              disabled={!canEdit}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${assignment.id}`}
                            >
                              <Edit3 />
                            </Button>
                            <Button
                              onClick={() =>
                                onModal({
                                  kind: 'assignmentForm',
                                  date: assignment.date,
                                  employeeId: assignment.employeeId,
                                  additional: true,
                                })
                              }
                              disabled={!editable}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Add coverage for ${employee.name}`}
                            >
                              <Plus />
                            </Button>
                            <Button
                              onClick={() =>
                                onModal({
                                  kind: 'swapAssignment',
                                  id: assignment.id,
                                })
                              }
                              disabled={!canEdit}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Swap ${assignment.id}`}
                            >
                              <ArrowLeftRight />
                            </Button>
                            <Button
                              onClick={() => cancelAssignment(assignment.id)}
                              disabled={!canEdit}
                              variant="ghost"
                              size="icon-sm"
                              className="text-rose-600"
                              aria-label={`Cancel ${assignment.id}`}
                            >
                              <XCircle />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function EmployeeManagement({
  state,
  setState,
  onModal,
}: {
  state: PortalState;
  setState: React.Dispatch<React.SetStateAction<PortalState>>;
  onModal: (modal: ModalState) => void;
}) {
  const [query, setQuery] = useState('');
  const employees = state.employees.filter((employee) =>
    `${employee.id} ${employee.name} ${employee.roleTitle}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const toggleActive = (id: string, active: boolean) =>
    setState((current) => ({
      ...current,
      employees: current.employees.map((employee) =>
        employee.id === id ? { ...employee, active } : employee,
      ),
    }));
  return (
    <>
      <PageIntro
        eyebrow="People master"
        title="Employee management"
        subtitle="Add, edit, activate, and assign a default operational area."
        action={
          <Button
            onClick={() => onModal({ kind: 'employeeForm' })}
            className="h-10 rounded-xl bg-[#b85c16] hover:bg-[#8a430e]"
          >
            <Plus /> Add employee
          </Button>
        }
      />
      <Card className="mt-7 border-0 py-0 shadow-[0_10px_35px_rgba(90,46,22,0.07)]">
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search employees"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employees"
              className="h-10 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Default area</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-6 py-3">
                    <span className="sr-only">Employee actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => {
                  const area = state.areas.find(
                    (item) => item.id === employee.defaultAreaId,
                  );
                  return (
                    <tr key={employee.id} className="hover:bg-orange-50/30">
                      <td className="px-6 py-4" aria-label={employee.name}>
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid size-9 place-items-center rounded-xl text-xs font-black ${employee.active ? 'bg-orange-50 text-[#8a430e]' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {employee.id}
                          </span>
                          <p className="font-extrabold text-slate-800">
                            {employee.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {employee.roleTitle}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {area
                          ? `${area.name} · ${area.description}`
                          : 'Unassigned'}
                      </td>
                      <td className="px-4 py-4">
                        <Switch
                          checked={employee.active}
                          onCheckedChange={(checked) =>
                            toggleActive(employee.id, checked)
                          }
                          aria-label={`${employee.active ? 'Deactivate' : 'Activate'} ${employee.name}`}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() =>
                            onModal({ kind: 'employeeForm', id: employee.id })
                          }
                          variant="ghost"
                          size="sm"
                        >
                          <Edit3 /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function AreaManagement({
  state,
  onModal,
}: {
  state: PortalState;
  onModal: (modal: ModalState) => void;
}) {
  return (
    <>
      <PageIntro
        eyebrow="Location master"
        title="Area management"
        subtitle="Maintain warehouse zones used by employees, checkpoints, and assignments."
        action={
          <Button
            onClick={() => onModal({ kind: 'areaForm' })}
            className="h-10 rounded-xl bg-[#b85c16] hover:bg-[#8a430e]"
          >
            <Plus /> Add area
          </Button>
        }
      />
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.areas.map((area) => {
          const checkpointCount = state.checkpoints.filter(
            (item) => item.areaId === area.id,
          ).length;
          const employees = state.employees.filter(
            (item) => item.defaultAreaId === area.id,
          ).length;
          return (
            <Card
              key={area.id}
              className="border-0 py-5 shadow-[0_8px_28px_rgba(90,46,22,0.07)]"
            >
              <CardHeader className="px-5">
                <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-orange-50 font-black text-[#8a430e]">
                  {area.name.replace('Zone ', 'Z')}
                </span>
                <CardTitle className="text-lg font-extrabold">
                  {area.name}
                </CardTitle>
                <CardDescription>{area.description}</CardDescription>
                <CardAction>
                  <Button
                    onClick={() => onModal({ kind: 'areaForm', id: area.id })}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${area.name}`}
                  >
                    <Edit3 />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-2xl font-black text-[#5a2e16]">
                      {checkpointCount}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Checkpoints
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-2xl font-black text-[#5a2e16]">
                      {employees}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Employees
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="mt-4">
                  {area.warehouseId === 'WH-1'
                    ? 'Main Warehouse'
                    : 'Secondary Warehouse · Demo'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function CheckpointManagement({
  state,
  onModal,
}: {
  state: PortalState;
  onModal: (modal: ModalState) => void;
}) {
  return (
    <>
      <PageIntro
        eyebrow="Checkpoint registry"
        title="Checkpoint management"
        subtitle="Map each operational checkpoint to its area, task template, and beacon identity."
        action={
          <Button
            onClick={() => onModal({ kind: 'checkpointForm' })}
            className="h-10 rounded-xl bg-[#b85c16] hover:bg-[#8a430e]"
          >
            <Plus /> Add checkpoint
          </Button>
        }
      />
      <Card className="mt-7 border-0 py-0 shadow-[0_10px_35px_rgba(90,46,22,0.07)]">
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
                <tr>
                  <th className="px-6 py-3">Checkpoint</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Task template</th>
                  <th className="px-4 py-3">Beacon</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-6 py-3">
                    <span className="sr-only">Checkpoint actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.checkpoints.map((checkpoint) => {
                  const area = state.areas.find(
                    (item) => item.id === checkpoint.areaId,
                  )!;
                  const template = state.taskTemplates.find(
                    (item) => item.id === checkpoint.taskTemplateId,
                  )!;
                  return (
                    <tr key={checkpoint.id} className="hover:bg-orange-50/30">
                      <td className="px-6 py-4" aria-label={checkpoint.name}>
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-xs font-black text-[#8a430e]">
                            {checkpoint.id}
                          </span>
                          <p className="font-extrabold text-slate-800">
                            {checkpoint.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {area.name} · {area.description}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {template.name}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-500">
                        {checkpoint.beaconId}
                      </td>
                      <td className="px-4 py-4">
                        <ModeBadge mode={checkpoint.mode} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() =>
                            onModal({
                              kind: 'checkpointForm',
                              id: checkpoint.id,
                            })
                          }
                          variant="ghost"
                          size="sm"
                        >
                          <Edit3 /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TemplateManagement({
  state,
  onModal,
}: {
  state: PortalState;
  onModal: (modal: ModalState) => void;
}) {
  return (
    <>
      <PageIntro
        eyebrow="Task library"
        title="Task templates"
        subtitle="Maintain reusable instructions applied to assignments and checkpoints."
        action={
          <Button
            onClick={() => onModal({ kind: 'templateForm' })}
            className="h-10 rounded-xl bg-[#b85c16] hover:bg-[#8a430e]"
          >
            <Plus /> Add template
          </Button>
        }
      />
      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {state.taskTemplates.map((template) => (
          <Card
            key={template.id}
            className="border-0 py-5 shadow-[0_8px_28px_rgba(90,46,22,0.07)]"
          >
            <CardHeader className="px-5">
              <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#b85c16]">
                <FileCheck2 className="size-5" />
              </span>
              <CardTitle className="text-lg font-extrabold">
                {template.name}
              </CardTitle>
              <CardDescription>{template.id}</CardDescription>
              <CardAction>
                <Button
                  onClick={() =>
                    onModal({ kind: 'templateForm', id: template.id })
                  }
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${template.name}`}
                >
                  <Edit3 />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-5">
              <p className="min-h-16 text-sm leading-6 text-slate-500">
                {template.instructions}
              </p>
              <Badge variant="outline" className="mt-4">
                {
                  state.checkpoints.filter(
                    (item) => item.taskTemplateId === template.id,
                  ).length
                }{' '}
                linked checkpoints
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function BeaconManagement({
  state,
  onModal,
}: {
  state: PortalState;
  onModal: (modal: ModalState) => void;
}) {
  const healthTone = {
    healthy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    needsAttention: 'bg-amber-50 text-amber-700 ring-amber-200',
    offline: 'bg-rose-50 text-rose-700 ring-rose-200',
  };
  const healthLabel = {
    healthy: 'Healthy',
    needsAttention: 'Needs attention',
    offline: 'Offline',
  };
  return (
    <>
      <PageIntro
        eyebrow="Hardware registry"
        title="Beacon management"
        subtitle="Review iBeacon identities and the representative health state used in this prototype."
        action={
          <Button
            onClick={() => onModal({ kind: 'beaconForm' })}
            className="h-10 rounded-xl bg-[#b85c16] hover:bg-[#8a430e]"
          >
            <Plus /> Add beacon
          </Button>
        }
      />
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {state.beacons.map((beacon) => (
          <Card
            key={beacon.id}
            className="border-0 py-5 shadow-[0_8px_28px_rgba(90,46,22,0.07)]"
          >
            <CardHeader className="px-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#b85c16]">
                  <Radio className="size-5" />
                </span>
                <Badge className={`${healthTone[beacon.health]} ring-1`}>
                  {healthLabel[beacon.health]}
                </Badge>
              </div>
              <CardTitle className="text-lg font-extrabold">
                {beacon.id}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {beacon.uuid}
              </CardDescription>
              <CardAction>
                <Button
                  onClick={() => onModal({ kind: 'beaconForm', id: beacon.id })}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${beacon.id}`}
                >
                  <Edit3 />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 px-5">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-mono text-lg font-black text-[#5a2e16]">
                  {beacon.major}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Major
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-mono text-lg font-black text-[#5a2e16]">
                  {beacon.minor}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Minor
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-mono text-lg font-black text-[#5a2e16]">
                  {beacon.measuredPower}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  dBm
                </p>
              </div>
              <p className="col-span-3 mt-1 text-xs text-slate-400">
                Last seen:{' '}
                {beacon.lastSeen
                  ? new Intl.DateTimeFormat('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(beacon.lastSeen))
                  : 'Never'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function PortalDialogs({
  state,
  setState,
  modal,
  setModal,
  today,
  role,
  notify,
}: {
  state: PortalState;
  setState: React.Dispatch<React.SetStateAction<PortalState>>;
  modal: ModalState;
  setModal: (modal: ModalState) => void;
  today: string;
  role: PortalRole;
  notify: (message: string) => void;
}) {
  if (!modal) return null;
  if (modal.kind === 'employeeDetail')
    return (
      <EmployeeDetailDialog
        key={modal.id}
        state={state}
        employeeId={modal.id}
        today={today}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'areaDetail')
    return (
      <AreaDetailDialog
        key={modal.id}
        state={state}
        areaId={modal.id}
        today={today}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'employeeForm')
    return (
      <EmployeeFormDialog
        key={modal.id ?? 'new'}
        state={state}
        employeeId={modal.id}
        save={(employee) => {
          setState((current) => ({
            ...current,
            employees: upsert(current.employees, employee),
          }));
          setModal(null);
          notify(`Employee ${employee.id} saved.`);
        }}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'areaForm')
    return (
      <AreaFormDialog
        key={modal.id ?? 'new'}
        state={state}
        areaId={modal.id}
        save={(area) => {
          setState((current) => ({
            ...current,
            areas: upsert(current.areas, area),
          }));
          setModal(null);
          notify(`Area ${area.id} saved.`);
        }}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'checkpointForm')
    return (
      <CheckpointFormDialog
        key={modal.id ?? 'new'}
        state={state}
        checkpointId={modal.id}
        save={(checkpoint) => {
          setState((current) => ({
            ...current,
            checkpoints: upsert(current.checkpoints, checkpoint),
          }));
          setModal(null);
          notify(`Checkpoint ${checkpoint.id} saved.`);
        }}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'templateForm')
    return (
      <TemplateFormDialog
        key={modal.id ?? 'new'}
        state={state}
        templateId={modal.id}
        save={(template) => {
          setState((current) => ({
            ...current,
            taskTemplates: upsert(current.taskTemplates, template),
          }));
          setModal(null);
          notify(`Template ${template.id} saved.`);
        }}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'beaconForm')
    return (
      <BeaconFormDialog
        key={modal.id ?? 'new'}
        state={state}
        beaconId={modal.id}
        save={(beacon) => {
          setState((current) => ({
            ...current,
            beacons: upsert(current.beacons, beacon),
          }));
          setModal(null);
          notify(`Beacon ${beacon.id} saved.`);
        }}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'assignmentForm')
    return (
      <AssignmentFormDialog
        key={
          modal.id ??
          `${modal.date}-${modal.employeeId ?? 'new'}-${modal.additional ? 'additional' : 'primary'}`
        }
        state={state}
        assignmentId={modal.id}
        date={modal.date}
        initialEmployeeId={modal.employeeId}
        additional={modal.additional}
        save={(assignment) => {
          setState((current) => ({
            ...current,
            assignments: upsert(current.assignments, assignment),
          }));
          setModal(null);
          notify(`Assignment ${assignment.id} saved.`);
        }}
        close={() => setModal(null)}
      />
    );
  if (modal.kind === 'swapAssignment')
    return (
      <SwapAssignmentDialog
        key={modal.id}
        state={state}
        assignmentId={modal.id}
        save={(targetId) => {
          setState((current) => {
            const source = current.assignments.find(
              (item) => item.id === modal.id,
            )!;
            const target = current.assignments.find(
              (item) => item.id === targetId,
            )!;
            return {
              ...current,
              assignments: current.assignments.map((item) =>
                item.id === source.id
                  ? { ...item, employeeId: target.employeeId }
                  : item.id === target.id
                    ? { ...item, employeeId: source.employeeId }
                    : item,
              ),
            };
          });
          setModal(null);
          notify('Employees swapped between assignments.');
        }}
        close={() => setModal(null)}
      />
    );
  return (
    <ProfileDialog
      state={state}
      role={role}
      save={(profileRole, name) => {
        setState((current) => ({
          ...current,
          profileNames: { ...current.profileNames, [profileRole]: name },
        }));
        setModal(null);
        notify('Profile display name updated.');
      }}
      close={() => setModal(null)}
    />
  );
}

function upsert<T extends { id: string }>(items: T[], value: T) {
  return items.some((item) => item.id === value.id)
    ? items.map((item) => (item.id === value.id ? value : item))
    : [...items, value];
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-slate-600">
      <span>{label}</span>
      {children}
    </label>
  );
}

function BaseFormDialog({
  title,
  description,
  children,
  submitLabel = 'Save changes',
  onSubmit,
  close,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  submitLabel?: string;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  close: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#12293f]">
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">{children}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#b85c16] hover:bg-[#8a430e]">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeDetailDialog({
  state,
  employeeId,
  today,
  close,
}: {
  state: PortalState;
  employeeId: string;
  today: string;
  close: () => void;
}) {
  const employee = state.employees.find((item) => item.id === employeeId)!;
  const assignments = state.assignments.filter(
    (item) => item.employeeId === employeeId && item.date === today,
  );
  const history = state.assignments.filter(
    (item) =>
      item.employeeId === employeeId &&
      (item.status === 'completed' || item.status === 'incomplete'),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 font-black text-blue-700">
              {employee.id}
            </span>
            <div>
              <DialogTitle className="text-xl font-extrabold">
                {employee.name}
              </DialogTitle>
              <DialogDescription>
                {employee.roleTitle} · {compliancePercent(history)}% recent
                compliance
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const area = state.areas.find(
              (item) => item.id === assignment.areaId,
            )!;
            const task = state.taskTemplates.find(
              (item) => item.id === assignment.taskTemplateId,
            )!;
            return (
              <Card key={assignment.id} className="py-4 shadow-none">
                <CardHeader className="px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-extrabold">
                        {area.name} · {area.description}
                      </CardTitle>
                      <CardDescription>
                        {task.name} · {assignment.startTime}–
                        {assignment.endTime}
                      </CardDescription>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </div>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="mb-4">
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span>Checkpoint progress</span>
                      <span>
                        {Math.round(assignmentProgress(assignment) * 100)}%
                      </span>
                    </div>
                    <ProgressBar value={assignmentProgress(assignment) * 100} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {assignment.checkpoints.map((item) => {
                      const checkpoint = state.checkpoints.find(
                        (entry) => entry.id === item.checkpointId,
                      )!;
                      return (
                        <div
                          key={item.checkpointId}
                          className={`rounded-xl border p-3 ${item.completedAt ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800">
                              {checkpoint.id} · {checkpoint.name}
                            </span>
                            {item.completedAt ? (
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            ) : (
                              <CircleDashed className="size-4 text-slate-400" />
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.completedAt
                              ? new Intl.DateTimeFormat('en-IN', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }).format(new Date(item.completedAt))
                              : 'Awaiting verification'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {!assignments.length && (
          <EmptyState
            title="No assignment today"
            detail="This employee has no active coverage on the selected operating date."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AreaDetailDialog({
  state,
  areaId,
  today,
  close,
}: {
  state: PortalState;
  areaId: string;
  today: string;
  close: () => void;
}) {
  const area = state.areas.find((item) => item.id === areaId)!;
  const assignments = state.assignments.filter(
    (item) =>
      item.areaId === areaId &&
      item.date === today &&
      item.status !== 'cancelled',
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {area.name} · {area.description}
          </DialogTitle>
          <DialogDescription>
            {assignments.length} employees assigned today
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {assignments.map((assignment) => {
            const employee = state.employees.find(
              (item) => item.id === assignment.employeeId,
            )!;
            return (
              <div key={assignment.id} className="flex items-center gap-3 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                  {employee.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{employee.name}</p>
                  <p className="text-xs text-slate-500">
                    {
                      assignment.checkpoints.filter((item) => item.completedAt)
                        .length
                    }{' '}
                    / {assignment.checkpoints.length} checkpoints
                  </p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeFormDialog({
  state,
  employeeId,
  save,
  close,
}: {
  state: PortalState;
  employeeId?: string;
  save: (employee: Employee) => void;
  close: () => void;
}) {
  const existing = state.employees.find((item) => item.id === employeeId);
  const nextId = `E${Math.max(0, ...state.employees.map((item) => Number(item.id.replace('E', '')) || 0)) + 1}`;
  const [form, setForm] = useState<Employee>(
    existing ?? {
      id: nextId,
      name: '',
      roleTitle: 'Floor Associate',
      defaultAreaId: state.areas[0].id,
      active: true,
    },
  );
  return (
    <BaseFormDialog
      title={existing ? `Edit ${existing.name}` : 'Add employee'}
      description="This record is stored in the browser-local Level 1 repository."
      onSubmit={(event) => {
        event.preventDefault();
        if (form.name.trim())
          save({
            ...form,
            name: form.name.trim(),
            roleTitle: form.roleTitle.trim(),
          });
      }}
      close={close}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Employee ID">
          <Input
            value={form.id}
            disabled={Boolean(existing)}
            onChange={(event) =>
              setForm({ ...form, id: event.target.value.toUpperCase() })
            }
            required
          />
        </FormField>
        <FormField label="Full name">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </FormField>
        <FormField label="Role title">
          <Input
            value={form.roleTitle}
            onChange={(event) =>
              setForm({ ...form, roleTitle: event.target.value })
            }
            required
          />
        </FormField>
        <FormField label="Default area">
          <NativeSelect
            className="w-full"
            value={form.defaultAreaId}
            onChange={(event) =>
              setForm({ ...form, defaultAreaId: event.target.value })
            }
          >
            {state.areas.map((area) => (
              <NativeSelectOption key={area.id} value={area.id}>
                {area.name} · {area.description}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
        <span>
          <span className="block text-sm font-extrabold">Active employee</span>
          <span className="mt-1 block text-xs text-slate-500">
            Available for assignment planning
          </span>
        </span>
        <Switch
          aria-label="Active employee"
          checked={form.active}
          onCheckedChange={(checked) => setForm({ ...form, active: checked })}
        />
      </div>
    </BaseFormDialog>
  );
}

function AreaFormDialog({
  state,
  areaId,
  save,
  close,
}: {
  state: PortalState;
  areaId?: string;
  save: (area: Area) => void;
  close: () => void;
}) {
  const existing = state.areas.find((item) => item.id === areaId);
  const nextId = `AREA-${Math.max(0, ...state.areas.map((item) => Number(item.id.replace('AREA-', '')) || 0)) + 1}`;
  const [form, setForm] = useState<Area>(
    existing ?? {
      id: nextId,
      name: `Zone ${state.areas.length + 1}`,
      description: '',
      warehouseId: 'WH-1',
    },
  );
  return (
    <BaseFormDialog
      title={existing ? `Edit ${existing.name}` : 'Add area'}
      description="Areas scope employees, checkpoints, and assignments to a site."
      onSubmit={(event) => {
        event.preventDefault();
        if (form.name.trim() && form.description.trim())
          save({
            ...form,
            name: form.name.trim(),
            description: form.description.trim(),
          });
      }}
      close={close}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Area ID">
          <Input
            value={form.id}
            disabled={Boolean(existing)}
            onChange={(event) =>
              setForm({ ...form, id: event.target.value.toUpperCase() })
            }
          />
        </FormField>
        <FormField label="Area name">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </FormField>
      </div>
      <FormField label="Description">
        <Input
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          placeholder="e.g. Returns Bay"
          required
        />
      </FormField>
      <FormField label="Warehouse">
        <NativeSelect
          className="w-full"
          value={form.warehouseId}
          onChange={(event) =>
            setForm({ ...form, warehouseId: event.target.value })
          }
        >
          <NativeSelectOption value="WH-1">Main Warehouse</NativeSelectOption>
          <NativeSelectOption value="WH-2">
            Secondary Warehouse (Demo)
          </NativeSelectOption>
        </NativeSelect>
      </FormField>
    </BaseFormDialog>
  );
}

function CheckpointFormDialog({
  state,
  checkpointId,
  save,
  close,
}: {
  state: PortalState;
  checkpointId?: string;
  save: (checkpoint: Checkpoint) => void;
  close: () => void;
}) {
  const existing = state.checkpoints.find((item) => item.id === checkpointId);
  const nextId = `A${Math.max(0, ...state.checkpoints.map((item) => Number(item.id.replace('A', '')) || 0)) + 1}`;
  const [form, setForm] = useState<Checkpoint>(
    existing ?? {
      id: nextId,
      name: '',
      areaId: state.areas[0].id,
      mode: 'demo',
      beaconId: state.beacons[0].id,
      taskTemplateId: state.taskTemplates[0].id,
    },
  );
  return (
    <BaseFormDialog
      title={existing ? `Edit checkpoint ${existing.id}` : 'Add checkpoint'}
      description="Only A1 is a physical Level 1 verification target; new records default to demo mode."
      onSubmit={(event) => {
        event.preventDefault();
        if (form.name.trim()) save({ ...form, name: form.name.trim() });
      }}
      close={close}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Checkpoint ID">
          <Input
            value={form.id}
            disabled={Boolean(existing)}
            onChange={(event) =>
              setForm({ ...form, id: event.target.value.toUpperCase() })
            }
          />
        </FormField>
        <FormField label="Checkpoint name">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </FormField>
        <FormField label="Area">
          <NativeSelect
            className="w-full"
            value={form.areaId}
            onChange={(event) =>
              setForm({ ...form, areaId: event.target.value })
            }
          >
            {state.areas.map((area) => (
              <NativeSelectOption key={area.id} value={area.id}>
                {area.name} · {area.description}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Data mode">
          <NativeSelect
            className="w-full"
            value={form.mode}
            onChange={(event) =>
              setForm({ ...form, mode: event.target.value as 'live' | 'demo' })
            }
          >
            <NativeSelectOption value="demo">Demo</NativeSelectOption>
            <NativeSelectOption value="live">Live physical</NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label="Beacon">
          <NativeSelect
            className="w-full"
            value={form.beaconId}
            onChange={(event) =>
              setForm({ ...form, beaconId: event.target.value })
            }
          >
            {state.beacons.map((beacon) => (
              <NativeSelectOption key={beacon.id} value={beacon.id}>
                {beacon.id}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Task template">
          <NativeSelect
            className="w-full"
            value={form.taskTemplateId}
            onChange={(event) =>
              setForm({ ...form, taskTemplateId: event.target.value })
            }
          >
            {state.taskTemplates.map((template) => (
              <NativeSelectOption key={template.id} value={template.id}>
                {template.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
    </BaseFormDialog>
  );
}

function TemplateFormDialog({
  state,
  templateId,
  save,
  close,
}: {
  state: PortalState;
  templateId?: string;
  save: (template: TaskTemplate) => void;
  close: () => void;
}) {
  const existing = state.taskTemplates.find((item) => item.id === templateId);
  const nextId = `TASK-${Math.max(0, ...state.taskTemplates.map((item) => Number(item.id.replace('TASK-', '')) || 0)) + 1}`;
  const [form, setForm] = useState<TaskTemplate>(
    existing ?? { id: nextId, name: '', instructions: '' },
  );
  return (
    <BaseFormDialog
      title={existing ? `Edit ${existing.name}` : 'Add task template'}
      description="Templates provide consistent instructions across multiple checkpoints."
      onSubmit={(event) => {
        event.preventDefault();
        if (form.name.trim() && form.instructions.trim())
          save({
            ...form,
            name: form.name.trim(),
            instructions: form.instructions.trim(),
          });
      }}
      close={close}
    >
      <FormField label="Template ID">
        <Input
          value={form.id}
          disabled={Boolean(existing)}
          onChange={(event) =>
            setForm({ ...form, id: event.target.value.toUpperCase() })
          }
        />
      </FormField>
      <FormField label="Template name">
        <Input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </FormField>
      <FormField label="Instructions">
        <textarea
          value={form.instructions}
          onChange={(event) =>
            setForm({ ...form, instructions: event.target.value })
          }
          required
          rows={4}
          className="min-h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
        />
      </FormField>
    </BaseFormDialog>
  );
}

function BeaconFormDialog({
  state,
  beaconId,
  save,
  close,
}: {
  state: PortalState;
  beaconId?: string;
  save: (beacon: Beacon) => void;
  close: () => void;
}) {
  const existing = state.beacons.find((item) => item.id === beaconId);
  const nextId = `BEACON-A${state.beacons.length + 1}`;
  const [form, setForm] = useState<Beacon>(
    existing ?? {
      id: nextId,
      uuid: '10000000-0000-0000-0000-000000000000',
      major: 1,
      minor: state.beacons.length + 1,
      measuredPower: -59,
      health: 'healthy',
      lastSeen: null,
    },
  );
  return (
    <BaseFormDialog
      title={existing ? `Edit ${existing.id}` : 'Add beacon'}
      description="Maintain the iBeacon identity used by checkpoint configuration."
      onSubmit={(event) => {
        event.preventDefault();
        save(form);
      }}
      close={close}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Beacon ID">
          <Input
            value={form.id}
            disabled={Boolean(existing)}
            onChange={(event) =>
              setForm({ ...form, id: event.target.value.toUpperCase() })
            }
          />
        </FormField>
        <FormField label="Health">
          <NativeSelect
            className="w-full"
            value={form.health}
            onChange={(event) =>
              setForm({
                ...form,
                health: event.target.value as Beacon['health'],
              })
            }
          >
            <NativeSelectOption value="healthy">Healthy</NativeSelectOption>
            <NativeSelectOption value="needsAttention">
              Needs attention
            </NativeSelectOption>
            <NativeSelectOption value="offline">Offline</NativeSelectOption>
          </NativeSelect>
        </FormField>
      </div>
      <FormField label="UUID">
        <Input
          value={form.uuid}
          onChange={(event) =>
            setForm({ ...form, uuid: event.target.value.toLowerCase() })
          }
          required
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Major">
          <Input
            type="number"
            min={0}
            max={65535}
            value={form.major}
            onChange={(event) =>
              setForm({ ...form, major: Number(event.target.value) })
            }
          />
        </FormField>
        <FormField label="Minor">
          <Input
            type="number"
            min={0}
            max={65535}
            value={form.minor}
            onChange={(event) =>
              setForm({ ...form, minor: Number(event.target.value) })
            }
          />
        </FormField>
        <FormField label="Measured power">
          <Input
            type="number"
            min={-127}
            max={0}
            value={form.measuredPower}
            onChange={(event) =>
              setForm({ ...form, measuredPower: Number(event.target.value) })
            }
          />
        </FormField>
      </div>
    </BaseFormDialog>
  );
}

function AssignmentFormDialog({
  state,
  assignmentId,
  date,
  initialEmployeeId,
  additional,
  save,
  close,
}: {
  state: PortalState;
  assignmentId?: string;
  date: string;
  initialEmployeeId?: string;
  additional?: boolean;
  save: (assignment: Assignment) => void;
  close: () => void;
}) {
  const existing = state.assignments.find((item) => item.id === assignmentId);
  const defaultEmployee =
    initialEmployeeId ??
    state.employees.find((item) => item.active)?.id ??
    state.employees[0].id;
  const defaultArea =
    state.employees.find((item) => item.id === defaultEmployee)
      ?.defaultAreaId ?? state.areas[0].id;
  const [form, setForm] = useState<Assignment>(
    existing ?? {
      id: `ASSIGN-${date.replaceAll('-', '')}-${state.assignments.length + 1}`,
      employeeId: defaultEmployee,
      date,
      areaId: defaultArea,
      taskTemplateId: state.taskTemplates[0].id,
      startTime: '09:00',
      endTime: '13:00',
      checkpoints: state.checkpoints
        .filter((item) => item.areaId === defaultArea)
        .slice(0, 2)
        .map((item) => ({ checkpointId: item.id, completedAt: null })),
      type: additional ? 'additional' : 'primary',
      status: date > dateKey(startOfDay()) ? 'planned' : 'notStarted',
    },
  );
  const changeArea = (areaId: string) =>
    setForm({
      ...form,
      areaId,
      checkpoints: state.checkpoints
        .filter((item) => item.areaId === areaId)
        .slice(0, 2)
        .map((item) => ({ checkpointId: item.id, completedAt: null })),
    });
  return (
    <BaseFormDialog
      title={
        existing
          ? `Edit assignment ${existing.id}`
          : additional
            ? 'Add additional coverage'
            : 'Create assignment'
      }
      description={`${formatPortalDate(date)} · ${form.type === 'primary' ? 'Primary assignment' : 'Additional coverage'}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (form.endTime > form.startTime && form.checkpoints.length)
          save(form);
      }}
      close={close}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Employee">
          <NativeSelect
            className="w-full"
            value={form.employeeId}
            onChange={(event) =>
              setForm({ ...form, employeeId: event.target.value })
            }
          >
            {state.employees
              .filter((item) => item.active)
              .map((employee) => (
                <NativeSelectOption key={employee.id} value={employee.id}>
                  {employee.id} · {employee.name}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </FormField>
        <FormField label="Assignment type">
          <NativeSelect
            className="w-full"
            value={form.type}
            onChange={(event) =>
              setForm({
                ...form,
                type: event.target.value as Assignment['type'],
              })
            }
          >
            <NativeSelectOption value="primary">Primary</NativeSelectOption>
            <NativeSelectOption value="additional">
              Additional
            </NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label="Area">
          <NativeSelect
            className="w-full"
            value={form.areaId}
            onChange={(event) => changeArea(event.target.value)}
          >
            {state.areas
              .filter((item) => item.warehouseId === 'WH-1')
              .map((area) => (
                <NativeSelectOption key={area.id} value={area.id}>
                  {area.name} · {area.description}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </FormField>
        <FormField label="Task template">
          <NativeSelect
            className="w-full"
            value={form.taskTemplateId}
            onChange={(event) =>
              setForm({ ...form, taskTemplateId: event.target.value })
            }
          >
            {state.taskTemplates.map((template) => (
              <NativeSelectOption key={template.id} value={template.id}>
                {template.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Start time">
          <Input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm({ ...form, startTime: event.target.value })
            }
          />
        </FormField>
        <FormField label="End time">
          <Input
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm({ ...form, endTime: event.target.value })
            }
          />
        </FormField>
      </div>
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-600">Checkpoint coverage</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {form.checkpoints.map((item) => (
            <Badge key={item.checkpointId} variant="outline">
              {item.checkpointId} ·{' '}
              {
                state.checkpoints.find(
                  (checkpoint) => checkpoint.id === item.checkpointId,
                )?.name
              }
            </Badge>
          ))}
        </div>
        {!form.checkpoints.length && (
          <p className="mt-2 text-xs text-rose-600">
            This area needs a checkpoint before it can be assigned.
          </p>
        )}
      </div>
    </BaseFormDialog>
  );
}

function SwapAssignmentDialog({
  state,
  assignmentId,
  save,
  close,
}: {
  state: PortalState;
  assignmentId: string;
  save: (targetId: string) => void;
  close: () => void;
}) {
  const source = state.assignments.find((item) => item.id === assignmentId)!;
  const candidates = state.assignments.filter(
    (item) =>
      item.date === source.date &&
      item.id !== source.id &&
      !['completed', 'incomplete', 'cancelled'].includes(item.status),
  );
  const [targetId, setTargetId] = useState(candidates[0]?.id ?? '');
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-extrabold">Swap assignments</DialogTitle>
          <DialogDescription>
            Exchange employees while preserving the two area and task plans.
          </DialogDescription>
        </DialogHeader>
        {candidates.length ? (
          <div className="py-4">
            <FormField label="Swap with">
              <NativeSelect
                className="w-full"
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                {candidates.map((item) => {
                  const employee = state.employees.find(
                    (entry) => entry.id === item.employeeId,
                  )!;
                  const area = state.areas.find(
                    (entry) => entry.id === item.areaId,
                  )!;
                  return (
                    <NativeSelectOption key={item.id} value={item.id}>
                      {employee.id} · {employee.name} · {area.name}
                    </NativeSelectOption>
                  );
                })}
              </NativeSelect>
            </FormField>
          </div>
        ) : (
          <EmptyState
            title="No editable assignment"
            detail="Another planned assignment on this date is required for a swap."
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!targetId}
            onClick={() => save(targetId)}
            className="bg-[#b85c16] hover:bg-[#8a430e]"
          >
            Swap employees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileDialog({
  state,
  role,
  save,
  close,
}: {
  state: PortalState;
  role: PortalRole;
  save: (role: PortalRole, name: string) => void;
  close: () => void;
}) {
  const [name, setName] = useState(state.profileNames[role]);
  return (
    <BaseFormDialog
      title={`${role === 'manager' ? 'Manager' : 'Admin'} profile`}
      description="The display name is a browser-local prototype preference."
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) save(role, name.trim());
      }}
      close={close}
    >
      <FormField label="Display name">
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <div className="rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
        <strong>Prototype access:</strong> role switching demonstrates
        authorization surfaces only. Production identity and permissions require
        the future backend.
      </div>
    </BaseFormDialog>
  );
}
