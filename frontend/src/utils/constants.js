// Application-wide constants

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PERIODS = Array.from({ length: 16 }, (_, i) => {
  const startHour = 8 + i;
  const formatTime = (h) => `${String(h).padStart(2, '0')}:00`;
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th'];
  return {
    label: `${ordinals[i] || (i + 1) + 'th'} Period`,
    start: formatTime(startHour),
    end: formatTime(startHour + 1)
  };
});

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
