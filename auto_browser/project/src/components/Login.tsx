import React, { useState } from 'react';
import { LogIn, User, Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    displayName: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (provider?: string) => {
    clearError();
    try {
      if (isRegistering) {
        await login('register', formData);
      } else {
        await login('local', formData);
      }
    } catch (error) {
      // Error handled in context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="card w-full max-w-md mx-auto animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-genfuze-green to-green-400 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
            <User className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-extrabold text-genfuze-green mb-2">Welcome to Genfuze.ai</h1>
          <p className="text-gray-300 text-center">Sign in to access your dashboard</p>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg p-4 mb-6 text-center font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-genfuze-green focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-genfuze-green focus:border-transparent transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-genfuze-green to-green-400 text-black font-bold py-3 px-6 rounded-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-genfuze-green font-medium underline underline-offset-2 transition-all duration-200 shadow-none hover:text-green-400 hover:shadow-glow hover:underline hover:decoration-4 hover:decoration-green-400 focus:outline-none focus:ring-2 focus:ring-genfuze-green"
            style={{
              textShadow: '0 0 8px #00FF41, 0 0 2px #00FF41',
              filter: 'drop-shadow(0 0 4px #00FF41)' // subtle always-on glow
            }}
          >
            {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Create one"}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-600/30 text-center">
          <p className="text-gray-400 text-sm">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 