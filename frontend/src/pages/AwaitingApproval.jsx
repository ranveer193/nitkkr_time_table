import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function AwaitingApproval() {
  const { t } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          Account Pending Approval
        </h1>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Your registration has been submitted successfully. A super administrator will review
          your request and approve or reject it shortly. You will be able to log in once
          your account is approved.
        </p>

        <div className="card p-4 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
            <p className="text-sm text-slate-600">Registration submitted to super admin</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
            <p className="text-sm text-slate-400">Admin reviews and approves account</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
            <p className="text-sm text-slate-400">You receive access to the admin portal</p>
          </div>
        </div>

        <Link
          to="/login"
          className={`${t.btnPrimary} w-full justify-center py-2.5`}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
