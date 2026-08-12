import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Sparkles, User, Lock, Mail, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    onLoginSuccess({
      id: 'user-' + Date.now(),
      name: name.trim() || email.split('@')[0],
      email: email,
      role: 'Lead Architect',
      isLoggedIn: true
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-luxury w-full max-w-md p-6 rounded-sm space-y-6 border border-[#C5A059]/40 relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            <h2 className="text-base font-serif text-white uppercase font-semibold">
              {isSignUp ? 'REGISTER ARCHITECT ACCOUNT' : 'NEXUSAI ACCESS AUTHENTICATION'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-1">FULL NAME</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  required={isSignUp}
                  placeholder="Architect Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-1">WORK EMAIL</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                placeholder="architect@nexus.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-1">PASSPHRASE</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-xs font-mono font-bold text-black bg-[#C5A059] hover:bg-[#d9b36a] uppercase rounded-xs transition-all flex items-center justify-center space-x-2"
          >
            <span>{isSignUp ? 'CREATE ARCHITECT CREDENTIALS' : 'AUTHENTICATE ACCESS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[11px] font-mono text-white/50 hover:text-[#C5A059] uppercase transition-all"
          >
            {isSignUp ? 'Already authenticated? Sign In' : "Don't have credentials? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
