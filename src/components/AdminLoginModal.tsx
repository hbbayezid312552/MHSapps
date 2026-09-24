import React, { useState } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Shield, KeyRound, Mail, X, AlertCircle, Lock } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('admin@moslemganj.edu.bd');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Default credentials check
      const trimmedEmail = email.trim().toLowerCase();
      const validEmail =
        trimmedEmail === 'admin@moslemganj.edu.bd' ||
        trimmedEmail === 'admin' ||
        trimmedEmail === 'mdbayezidbostami15@gmail.com';
      const validPass = password.trim() === 'admin123';

      if (validEmail && validPass) {
        setIsLoading(false);
        onLoginSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setError('ভুল ইমেইল বা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন। (ডেমো ক্রেডেনশিয়াল: admin / admin123)');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-6 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-300 hover:text-white p-1 rounded-full hover:bg-emerald-900"
          >
            <X className="w-5 h-5" />
          </button>
          <SchoolLogo size={52} className="mx-auto mb-2" />
          <h3 className="text-lg font-bold font-bengali">প্রশাসনিক লগইন</h3>
          <p className="text-xs text-emerald-300">মোসলেমগঞ্জ উচ্চ বিদ্যালয় ম্যানেজমেন্ট প্যানেল</p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <span className="font-bold">ডিফল্ট অ্যাডমিন এক্সেস:</span><br />
            ব্যবহারকারী: <span className="font-mono text-emerald-800 font-semibold">admin</span><br />
            পাসওয়ার্ড: <span className="font-mono text-emerald-800 font-semibold">admin123</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                অ্যাডমিন ইমেইল / ইউজারনেম
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@moslemganj.edu.bd"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>{isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
