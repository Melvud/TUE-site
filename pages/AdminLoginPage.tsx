
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Section from '../components/Section';

const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useData();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(password)) {
      navigate('/admin');
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="bg-slate-900 min-h-[calc(100vh-200px)] flex items-center">
      <Section title="Admin Login">
        <div className="max-w-md mx-auto bg-slate-800/50 p-8 rounded-lg shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                name="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500 transition"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div>
              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-6 rounded-md transition-transform duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30">
                Login
              </button>
            </div>
          </form>
        </div>
      </Section>
    </div>
  );
};

export default AdminLoginPage;
