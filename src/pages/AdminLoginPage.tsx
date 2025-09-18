// src/pages/AdminLoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import { useData } from '../context/DataContext';

const AdminLoginPage: React.FC = () => {
  const { login } = useData();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      nav('/admin', { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">Admin Login</h1>
        <p className="text-xl text-slate-300 mt-4">Sign in to manage content</p>
      </div>
      <Section>
        <form
          onSubmit={onSubmit}
          className="max-w-md mx-auto bg-slate-800/50 p-8 rounded-lg shadow-2xl space-y-6"
        >
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              className="w-full bg-slate-700 text-white rounded-md p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              className="w-full bg-slate-700 text-white rounded-md p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-6 rounded-md disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Section>
    </div>
  );
};

export default AdminLoginPage;
