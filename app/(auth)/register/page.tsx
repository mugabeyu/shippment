'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Ship, Lock, User, Phone, Camera, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppConfig } from '@/lib/swr';

type StaffInvite = {
  id: string;
  email: string;
  role: string;
  active: boolean;
};

function StaffRegisterInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { config } = useAppConfig();
  const registerContent = config?.register_content || {};
  const staffId = searchParams.get('staffId');

  const [staff, setStaff] = useState<StaffInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    photo: ''
  });
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    if (!staffId) {
      setError('Invalid invitation link. Missing staff ID.');
      setVerifying(false);
      return;
    }

    api.getStaffMember(staffId)
      .then((data) => {
        setStaff(data);
        if (data.name) setFormData((f) => ({ ...f, name: data.name }));
        if (data.phone) setFormData((f) => ({ ...f, phone: data.phone }));
      })
      .catch(() => setError('Invitation not found or has expired.'))
      .finally(() => setVerifying(false));
  }, [staffId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!staffId) throw new Error('Missing invitation');
      if (!formData.name || !formData.phone || !formData.password) {
        throw new Error('Please fill in all required fields');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await api.registerStaff(staffId, {
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        photo: formData.photo
      });

      setSuccess(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setFormData({ ...formData, photo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-500">Verifying invitation...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold text-navy-900">Registration Complete</h2>
          <p className="text-sm text-slate-600">Your account has been created. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-[58%] bg-navy-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16 h-full">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
              <Ship className="w-6 h-6 text-white" />
            </div>
            <div>
               <h1 className="text-xl font-bold text-white tracking-tight">{registerContent.companyName || 'La Grande Marque'}</h1>
               <p className="text-xs text-blue-200 font-medium">{registerContent.companyTagline || 'Shipping & Logistics Management'}</p>
            </div>
          </div>
          <div className="space-y-6 max-w-xl">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1]">
              {registerContent.headline || 'Join the Team'}
            </h2>
            <p className="text-lg text-blue-100/90 leading-relaxed max-w-[500px]">
              {registerContent.subheadline || 'Complete your registration to access the La Grande Marque admin dashboard.'}
            </p>
          </div>
          <div className="h-6"></div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-[520px]">
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <Ship className="w-6 h-6 text-white" />
            </div>
             <div>
                <h1 className="text-xl font-bold text-navy-900">{registerContent.companyName || 'La Grande Marque'}</h1>
                <p className="text-xs text-slate-500 font-medium">{registerContent.companyTagline || 'Shipping & Logistics Management'}</p>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-[32px] font-bold text-navy-900 leading-tight tracking-tight">Complete Registration</h2>
              <p className="text-sm text-slate-500 mt-3">
                You've been invited to join <span className="font-semibold">{staff?.email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {!staff || staff.active ? (
              <div className="text-center py-8 text-slate-500">
                This invitation is no longer valid. Please contact your administrator.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex justify-center mb-4">
                  <label className="relative w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field pl-11"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field pl-11"
                      placeholder="+261 34 000 0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field pl-11"
                      placeholder="Create a password (min 6 characters)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input-field pl-11"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:translate-y-[-1px] active:translate-y-0 active:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center text-[15px]"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <p className="font-medium">{registerContent.copyright || '© 2026 La Grande Marque'}</p>
            <p className="font-medium">Secure Staff Registration</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffRegister() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-slate-500">Loading...</div></div>}>
      <StaffRegisterInner />
    </Suspense>
  );
}
