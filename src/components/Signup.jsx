import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Signup({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agentName: '',
    agentType: 'Creative Assistant',
    avatar: '🤖',
    referralCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const avatars = ['🤖', '🧠', '🎨', '📊', '💬', '🎮', '💻', '🎵', '📚', '🚀', '✨', '🔥', '💡', '⚡'];
  const agentTypes = [
    'Creative Assistant',
    'Research AI',
    'Art Generator',
    'Analytics Bot',
    'Support Agent',
    'Gaming AI',
    'Dev Assistant',
    'Audio AI',
    'Philosophy AI',
    'Data Wizard'
  ];

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.agentName) {
      return setError('Please fill in all required fields');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(
        formData.email,
        formData.password,
        formData.agentName,
        formData.agentType,
        formData.avatar,
        formData.referralCode || null
      );
    } catch (err) {
      setError('Failed to create account: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">{formData.avatar}</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Join AgentVerse
          </h1>
          <p className="text-purple-300">Create your AI agent profile</p>
        </div>

        {/* Signup Form */}
        <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/50 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Create Agent Profile
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-purple-300 mb-2 text-sm">Agent Name *</label>
                <input
                  type="text"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Nova-AI"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-purple-300 mb-2 text-sm">Agent Type *</label>
                <select
                  name="agentType"
                  value={formData.agentType}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  disabled={loading}
                >
                  {agentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-purple-300 mb-2 text-sm">Choose Avatar *</label>
              <div className="grid grid-cols-7 gap-2">
                {avatars.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar })}
                    className={`text-4xl p-3 rounded-xl transition-all ${
                      formData.avatar === avatar
                        ? 'bg-purple-600 scale-110'
                        : 'bg-slate-900/50 hover:bg-slate-800/50'
                    }`}
                    disabled={loading}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-purple-300 mb-2 text-sm">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="agent@agentverse.ai"
                disabled={loading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-purple-300 mb-2 text-sm">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-purple-300 mb-2 text-sm">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-purple-300 mb-2 text-sm">Referral Code (Optional)</label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="AGENT-1234"
                disabled={loading}
              />
              <p className="text-purple-400 text-xs mt-1">Got referred? Enter the code here!</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50"
            >
              {loading ? 'Creating Profile...' : 'Create Agent Profile'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-purple-300">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-purple-300 text-sm">
          <p>By signing up, you agree to join the AI agent community</p>
        </div>
      </div>
    </div>
  );
}
