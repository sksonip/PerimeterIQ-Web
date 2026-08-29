export type PortalRole = 'manager' | 'admin';
export type AssignmentStatus =
  | 'planned'
  | 'notStarted'
  | 'inProgress'
  | 'completed'
  | 'incomplete'
  | 'cancelled';
export type AssignmentType = 'primary' | 'additional';
export type DataMode = 'live' | 'demo';
export type BeaconHealth = 'healthy' | 'needsAttention' | 'offline';

export interface Employee {
  id: string;
  name: string;
  roleTitle: string;
  defaultAreaId: string;
  active: boolean;
}

export interface Area {
  id: string;
  name: string;
  description: string;
  warehouseId: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  instructions: string;
}

export interface Beacon {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  measuredPower: number;
  health: BeaconHealth;
  lastSeen: string | null;
}

export interface Checkpoint {
  id: string;
  name: string;
  areaId: string;
  mode: DataMode;
  beaconId: string;
  taskTemplateId: string;
}

export interface AssignmentCheckpoint {
  checkpointId: string;
  completedAt: string | null;
}

export interface Assignment {
  id: string;
  employeeId: string;
  date: string;
  areaId: string;
  taskTemplateId: string;
  startTime: string;
  endTime: string;
  checkpoints: AssignmentCheckpoint[];
  type: AssignmentType;
  status: AssignmentStatus;
}

export interface PortalState {
  employees: Employee[];
  areas: Area[];
  checkpoints: Checkpoint[];
  taskTemplates: TaskTemplate[];
  beacons: Beacon[];
  assignments: Assignment[];
  profileNames: Record<PortalRole, string>;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatPortalDate(
  key: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(
    'en-IN',
    options ?? {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  ).format(new Date(year, month - 1, day));
}

export function createDemoState(baseDate = startOfDay()): PortalState {
  const today = dateKey(baseDate);
  const employeeNames = [
    'Aarav Sharma',
    'Priya Nair',
    'Rohan Verma',
    'Meera Iyer',
    'Kabir Khan',
    'Ananya Gupta',
    'Vikram Das',
    'Ishita Bose',
    'Dev Patel',
    'Sana Ali',
  ];
  const employees: Employee[] = employeeNames.map((name, index) => ({
    id: `E${index + 1}`,
    name,
    roleTitle: index < 6 ? 'Floor Associate' : 'Shift Associate',
    defaultAreaId: `AREA-${(index % 3) + 1}`,
    active: true,
  }));

  const areas: Area[] = [
    {
      id: 'AREA-1',
      name: 'Zone 1',
      description: 'Main Floor',
      warehouseId: 'WH-1',
    },
    {
      id: 'AREA-2',
      name: 'Zone 2',
      description: 'Packing Bay',
      warehouseId: 'WH-1',
    },
    {
      id: 'AREA-3',
      name: 'Zone 3',
      description: 'Dispatch Gate',
      warehouseId: 'WH-1',
    },
    {
      id: 'AREA-4',
      name: 'Zone 4',
      description: 'Secondary site staging',
      warehouseId: 'WH-2',
    },
  ];

  const taskTemplates: TaskTemplate[] = [
    {
      id: 'TASK-1',
      name: 'Safety walk-through',
      instructions: 'Visit each checkpoint and confirm the work area is clear.',
    },
    {
      id: 'TASK-2',
      name: 'Station readiness',
      instructions:
        'Check readiness and report any obstruction to the supervisor.',
    },
    {
      id: 'TASK-3',
      name: 'Quality round',
      instructions:
        'Complete the area quality checkpoints within the assigned window.',
    },
  ];

  const beacons: Beacon[] = [
    {
      id: 'BEACON-A1',
      uuid: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      major: 65535,
      minor: 65535,
      measuredPower: -45,
      health: 'healthy',
      lastSeen: new Date(
        baseDate.getTime() + 12 * 60 * 60 * 1000,
      ).toISOString(),
    },
    {
      id: 'BEACON-A2',
      uuid: '10000000-0000-0000-0000-000000000002',
      major: 1,
      minor: 2,
      measuredPower: -59,
      health: 'needsAttention',
      lastSeen: addDays(baseDate, -1).toISOString(),
    },
    {
      id: 'BEACON-A3',
      uuid: '10000000-0000-0000-0000-000000000003',
      major: 1,
      minor: 3,
      measuredPower: -59,
      health: 'offline',
      lastSeen: null,
    },
    {
      id: 'BEACON-A4',
      uuid: '10000000-0000-0000-0000-000000000004',
      major: 1,
      minor: 4,
      measuredPower: -59,
      health: 'healthy',
      lastSeen: new Date(
        baseDate.getTime() + 10 * 60 * 60 * 1000,
      ).toISOString(),
    },
  ];

  const checkpoints: Checkpoint[] = [
    {
      id: 'A1',
      name: 'Main Floor Entry',
      areaId: 'AREA-1',
      mode: 'live',
      beaconId: 'BEACON-A1',
      taskTemplateId: 'TASK-1',
    },
    {
      id: 'A2',
      name: 'Packing Line',
      areaId: 'AREA-2',
      mode: 'demo',
      beaconId: 'BEACON-A2',
      taskTemplateId: 'TASK-2',
    },
    {
      id: 'A3',
      name: 'Dispatch Gate',
      areaId: 'AREA-3',
      mode: 'demo',
      beaconId: 'BEACON-A3',
      taskTemplateId: 'TASK-1',
    },
    {
      id: 'A4',
      name: 'Loading Dock',
      areaId: 'AREA-3',
      mode: 'demo',
      beaconId: 'BEACON-A4',
      taskTemplateId: 'TASK-2',
    },
    {
      id: 'A5',
      name: 'Main Floor West',
      areaId: 'AREA-1',
      mode: 'demo',
      beaconId: 'BEACON-A2',
      taskTemplateId: 'TASK-1',
    },
    {
      id: 'A6',
      name: 'Main Floor East',
      areaId: 'AREA-1',
      mode: 'demo',
      beaconId: 'BEACON-A2',
      taskTemplateId: 'TASK-3',
    },
    {
      id: 'A7',
      name: 'Packing Quality',
      areaId: 'AREA-2',
      mode: 'demo',
      beaconId: 'BEACON-A3',
      taskTemplateId: 'TASK-3',
    },
    {
      id: 'A8',
      name: 'Dispatch Desk',
      areaId: 'AREA-3',
      mode: 'demo',
      beaconId: 'BEACON-A4',
      taskTemplateId: 'TASK-3',
    },
  ];

  const todayAreas = [
    'AREA-1',
    'AREA-2',
    'AREA-3',
    'AREA-1',
    'AREA-2',
    'AREA-3',
    'AREA-1',
    'AREA-2',
    'AREA-3',
    'AREA-1',
  ];
  const checkpointSets = [
    ['A1'],
    ['A2', 'A7'],
    ['A3', 'A4', 'A8'],
    ['A5', 'A6'],
    ['A2', 'A7'],
    ['A3', 'A4', 'A8'],
    ['A5', 'A6'],
    ['A2', 'A7'],
    ['A3', 'A8'],
    ['A5', 'A6'],
  ];
  const statuses: AssignmentStatus[] = [
    'notStarted',
    'completed',
    'completed',
    'completed',
    'inProgress',
    'inProgress',
    'notStarted',
    'incomplete',
    'incomplete',
    'completed',
  ];
  const completedCounts = [0, 2, 3, 2, 1, 2, 0, 1, 0, 2];

  const assignments: Assignment[] = employees.map((employee, index) => {
    const startTime = index < 5 ? '09:00' : '13:00';
    return {
      id: `TODAY-${index + 1}`,
      employeeId: employee.id,
      date: today,
      areaId: todayAreas[index],
      taskTemplateId: `TASK-${(index % 3) + 1}`,
      startTime,
      endTime: index < 5 ? '13:00' : '17:00',
      checkpoints: checkpointSets[index].map(
        (checkpointId, checkpointIndex) => ({
          checkpointId,
          completedAt:
            checkpointIndex < completedCounts[index]
              ? `${today}T${index < 5 ? '10' : '14'}:${pad(12 + index * 3 + checkpointIndex * 8)}:00`
              : null,
        }),
      ),
      type: 'primary',
      status: statuses[index],
    };
  });

  for (let offset = 1; offset <= 7; offset += 1) {
    const futureDate = dateKey(addDays(baseDate, offset));
    employees.forEach((employee, employeeIndex) => {
      const areaId = `AREA-${((employeeIndex + offset) % 3) + 1}`;
      const matching = checkpoints
        .filter((checkpoint) => checkpoint.areaId === areaId)
        .slice(0, employeeIndex === 0 ? 1 : 2);
      assignments.push({
        id: `PLAN-${offset}-${employeeIndex + 1}`,
        employeeId: employee.id,
        date: futureDate,
        areaId,
        taskTemplateId: `TASK-${(employeeIndex % 3) + 1}`,
        startTime: '09:00',
        endTime: '13:00',
        checkpoints: matching.map((checkpoint) => ({
          checkpointId: checkpoint.id,
          completedAt: null,
        })),
        type: 'primary',
        status: 'planned',
      });
    });
  }

  for (let offset = 1; offset <= 28; offset += 1) {
    const historyDate = dateKey(addDays(baseDate, -offset));
    employees.forEach((employee, employeeIndex) => {
      const areaId = `AREA-${((employeeIndex + offset) % 3) + 1}`;
      const matching = checkpoints
        .filter((checkpoint) => checkpoint.areaId === areaId)
        .slice(0, 2);
      const completed =
        (offset * 7 + employeeIndex * 11) % 100 < 72 + (offset % 5) * 4;
      const partialCount = completed
        ? matching.length
        : (employeeIndex + offset) % 2;
      assignments.push({
        id: `HIST-${offset}-${employeeIndex + 1}`,
        employeeId: employee.id,
        date: historyDate,
        areaId,
        taskTemplateId: `TASK-${(employeeIndex % 3) + 1}`,
        startTime: '09:00',
        endTime: '13:00',
        checkpoints: matching.map((checkpoint, checkpointIndex) => ({
          checkpointId: checkpoint.id,
          completedAt:
            checkpointIndex < partialCount
              ? `${historyDate}T10:${pad(10 + employeeIndex + checkpointIndex * 20)}:00`
              : null,
        })),
        type: 'primary',
        status: completed ? 'completed' : 'incomplete',
      });
    });
  }

  return {
    employees,
    areas,
    checkpoints,
    taskTemplates,
    beacons,
    assignments,
    profileNames: { manager: 'Maya Singh', admin: 'Arjun Mehta' },
  };
}

export function assignmentProgress(assignment: Assignment) {
  if (!assignment.checkpoints.length) return 0;
  return (
    assignment.checkpoints.filter((checkpoint) => checkpoint.completedAt)
      .length / assignment.checkpoints.length
  );
}

export function statusLabel(status: AssignmentStatus) {
  return {
    planned: 'Planned',
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed',
    incomplete: 'Incomplete',
    cancelled: 'Cancelled',
  }[status];
}

export function kpisForDate(assignments: Assignment[], day: string) {
  const primary = assignments.filter(
    (item) =>
      item.date === day &&
      item.type === 'primary' &&
      item.status !== 'cancelled',
  );
  const count = (status: AssignmentStatus) =>
    primary.filter((item) => item.status === status).length;
  return {
    total: primary.length,
    completed: count('completed'),
    inProgress: count('inProgress'),
    notStarted: count('notStarted') + count('planned'),
    incomplete: count('incomplete'),
    exceptions: 0,
  };
}

export function compliancePercent(assignments: Assignment[]) {
  const resolved = assignments.filter(
    (item) => item.status === 'completed' || item.status === 'incomplete',
  );
  if (!resolved.length) return 0;
  return Math.round(
    (resolved.filter((item) => item.status === 'completed').length /
      resolved.length) *
      100,
  );
}

export function recentComplianceByEmployee(state: PortalState) {
  return state.employees
    .map((employee) => ({
      id: employee.id,
      label: employee.name,
      value: compliancePercent(
        state.assignments.filter((item) => item.employeeId === employee.id),
      ),
    }))
    .sort((a, b) => b.value - a.value);
}

export function recentComplianceByArea(state: PortalState) {
  return state.areas
    .filter((area) => area.warehouseId === 'WH-1')
    .map((area) => ({
      id: area.id,
      label: `${area.name} · ${area.description}`,
      value: compliancePercent(
        state.assignments.filter((item) => item.areaId === area.id),
      ),
    }))
    .sort((a, b) => b.value - a.value);
}

export function dailyComplianceTrend(state: PortalState, days = 14) {
  const today = startOfDay();
  return Array.from({ length: days }, (_, index) => {
    const key = dateKey(addDays(today, -(days - index)));
    const resolved = state.assignments.filter(
      (item) =>
        item.date === key &&
        (item.status === 'completed' || item.status === 'incomplete'),
    );
    const completed = resolved.filter(
      (item) => item.status === 'completed',
    ).length;
    return {
      date: new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
      }).format(addDays(today, -(days - index))),
      compliance: resolved.length
        ? Math.round((completed / resolved.length) * 100)
        : 0,
      completed,
      incomplete: resolved.length - completed,
    };
  });
}
