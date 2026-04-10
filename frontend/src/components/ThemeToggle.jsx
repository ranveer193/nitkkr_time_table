import { useTheme } from '../context/ThemeContext';
import { THEMES } from '../utils/constants';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isEmerald = theme === THEMES.EMERALD;

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${isEmerald ? 'Indigo' : 'Emerald'} theme`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors duration-150 ${
        isEmerald
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
      } ${className}`}
    >
      <span className="text-base">{isEmerald ? '🌿' : '💜'}</span>
      <span className="hidden sm:inline">{isEmerald ? 'Emerald' : 'Indigo'}</span>
    </button>
  );
}
