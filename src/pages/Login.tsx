import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Lock, Mail, X } from 'lucide-react';
export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    navigate('/dashboard');
  };
  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
  };
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-4">
            <Ship className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">
            LA GRANDE MARQUE
          </h1>
          <p className="text-zinc-500 mt-2">Shipping Administration Portal</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="admin@lagrandemarque.com" />
                
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(true);
                    setResetSent(false);
                  }}
                  className="text-sm text-yellow-500 hover:text-yellow-400">
                  
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="••••••••" />
                
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-yellow-500 text-zinc-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors">
              
              Sign In
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-sm text-zinc-600">
          &copy; 2026 La Grande Marque. All rights reserved.
        </div>
      </div>

      {showReset &&
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setShowReset(false)}>
        
          <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                Reset Password
              </h2>
              <button
              onClick={() => setShowReset(false)}
              aria-label="Close"
              className="text-zinc-400 hover:text-white transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>
            {resetSent ?
          <div className="p-6 text-center space-y-4">
                <p className="text-zinc-300">
                  If an account exists for{' '}
                  <span className="text-yellow-500">{resetEmail}</span>, a reset
                  link has been sent.
                </p>
                <button
              onClick={() => setShowReset(false)}
              className="px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
              
                  Done
                </button>
              </div> :

          <form onSubmit={handleReset} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <input
                required
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@lagrandemarque.com"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
              
                </div>
                <button
              type="submit"
              className="w-full py-2.5 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
              
                  Send Reset Link
                </button>
              </form>
          }
          </div>
        </div>
      }
    </div>);

}