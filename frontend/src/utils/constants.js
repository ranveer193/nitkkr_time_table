// Application-wide constants

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PERIODS = [
  { label: '1st Period', start: '08:00', end: '09:00' },
  { label: '2nd Period', start: '09:00', end: '10:00' },
  { label: '3rd Period', start: '10:00', end: '11:00' },
  { label: '4th Period', start: '11:00', end: '12:00' },
  { label: 'Lunch Break', start: '12:00', end: '13:00' },
  { label: '5th Period', start: '13:00', end: '14:00' },
  { label: '6th Period', start: '14:00', end: '15:00' },
  { label: '7th Period', start: '15:00', end: '16:00' },
  { label: '8th Period', start: '16:00', end: '17:00' },
];

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const THEMES = {
  INDIGO: 'indigo',
  EMERALD: 'emerald',
};

export const DEPARTMENT_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' }, // blue
  { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, // green
  { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' }, // amber
  { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' }, // pink
  { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' }, // violet
  { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }, // orange
  { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' }, // cyan
  { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }, // slate
];
