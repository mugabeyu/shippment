'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ship, Mail, Lock, Eye, EyeOff, CheckCircle2, Globe, Shield, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppConfig } from '@/lib/swr';

const ICON_MAP: Record<string, React.ComponentType<{className?: string}>> = {
  Globe,
  Shield,
  BarChart3
};

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function Login() {
  const router = useRouter();
  const { config } = useAppConfig();
  const loginContent = config?.login_content || {};
  const loginFeatures = config?.login_features || [];
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setFormErrors({});

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, email, role, phone, photo, active')
        .eq('auth_uid', data.user.id)
        .single();

      if (staffError || !staffData || !staffData.active) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Please contact your administrator.');
      }

      localStorage.setItem('activeStaffName', staffData.name || '');
      localStorage.setItem('activeStaffEmail', staffData.email || '');
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      router.replace('/dashboard');
    } catch (error: any) {
      setFormErrors({ general: error.message || 'Invalid email or password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail);
      if (error) throw error;
      setForgotPasswordSent(true);
    } catch (error: any) {
      setFormErrors({ general: error.message || 'Failed to send reset link' });
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/backgroundimage.jpeg')` }}></div>

      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden" style={{ height: '100vh' }}>
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#60A5FA" strokeWidth="0.8" opacity="0.5">
            <path d="M120,180 Q180,160 240,180 T320,220 T280,320 T180,380 T120,280 Z" />
            <path d="M260,400 Q300,380 340,420 T320,540 T260,600 T230,480 Z" />
            <path d="M500,160 Q560,140 600,180 T560,260 T500,240 Z" />
            <path d="M520,280 Q580,260 600,330 T560,480 T500,460 T480,330 Z" />
            <path d="M640,140 Q780,110 900,180 T860,340 T700,360 T640,240 Z" />
            <path d="M840,440 Q900,420 940,480 T900,560 T820,500 Z" />
          </g>
          <g stroke="#3B82F6" strokeWidth="1.5" fill="none" strokeDasharray="8,8" opacity="0.7">
            <path d="M240,260 Q380,180 520,220" className="animate-route-dash" />
            <path d="M520,220 Q660,280 800,320" className="animate-route-dash" style={{ animationDelay: '1s' }} />
            <path d="M240,260 Q420,380 580,420" className="animate-route-dash" style={{ animationDelay: '2s' }} />
          </g>
          <g fill="#60A5FA" opacity="0.8">
            <circle r="3" className="animate-pulse">
              <animateMotion dur="3s" repeatCount="indefinite" path="M240,260 Q380,180 520,220" />
            </circle>
            <circle r="3" className="animate-pulse" style={{ animationDelay: '1s' }}>
              <animateMotion dur="4s" repeatCount="indefinite" path="M520,220 Q660,280 800,320" />
            </circle>
            <circle r="3" className="animate-pulse" style={{ animationDelay: '2s' }}>
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M240,260 Q420,380 580,420" />
            </circle>
          </g>
        </svg>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16 h-full">
          <div className="flex items-center space-x-3 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <div className="w-11 h-11 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
              <Ship className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-8 max-w-xl">
            <div className="space-y-5 opacity-0 animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
              <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                {loginContent.headline || 'Smart Shipping. Stronger Connections.'}
              </h2>
              <p className="text-lg text-blue-100/90 leading-relaxed max-w-[550px]">
                {loginContent.subheadline || 'Manage shipments worldwide with intelligent logistics, real-time cargo tracking, automated operations, analytics, and enterprise-grade security.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              {loginFeatures.map((feature: any, idx: number) => {
                const Icon = ICON_MAP[feature.icon] || Globe;
                return (
                  <div key={idx} className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-blue-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-xs text-blue-100/80 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-6"></div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12" style={{ height: '100vh' }}>
        <div className="w-full max-w-[520px]">
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center shadow-sm">
              <Ship className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="bg-white backdrop-blur-md border border-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-5">
                <Ship className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-[42px] font-bold text-navy-900 leading-tight tracking-tight">{loginContent.welcomeTitle || 'Welcome Back'}</h2>
              <p className="text-sm text-navy-500 mt-3 leading-relaxed">
                {loginContent.welcomeSubtitle || 'Sign in to continue to the admin dashboard'}
              </p>
            </div>

            {formErrors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600 font-medium">{formErrors.general}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-navy-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field pl-11 ${formErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-navy-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`input-field pl-11 pr-12 ${formErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-navy-400 hover:text-navy-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: '18px' }}>
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-navy-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-sm text-navy-700 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotPasswordSent(false);
                  }}
                  className="text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-primary to-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:translate-y-[-1px] active:translate-y-0 active:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center text-[15px]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50/80 border border-blue-100 rounded-xl">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-xs text-navy-600 leading-relaxed">
                  {loginContent.securityNote || 'For your security, always sign out before leaving your workstation.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-navy-400">
            <p className="font-medium">{loginContent.copyright || '© 2026'}</p>
            <p className="font-medium">Version 1.0.0</p>
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-navy-100 rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-2">Reset Password</h3>
              <p className="text-sm text-navy-500">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {forgotPasswordSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-medium">
                    If an account exists, a reset link has been sent.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordSent(false);
                    setForgotPasswordEmail('');
                  }}
                  className="btn-primary"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-navy-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={forgotPasswordEmail}
                        onChange={e => setForgotPasswordEmail(e.target.value)}
                        className="input-field pl-11 h-14"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={!forgotPasswordEmail}
                    className="btn-primary"
                  >
                    Send Reset Link
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                  }}
                  className="mt-4 w-full text-center text-sm text-navy-500 hover:text-navy-700 transition-colors"
                >
                  Back to Login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

