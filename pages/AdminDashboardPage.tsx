
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Section from '../components/Section';

const AdminDashboardPage: React.FC = () => {
  const { logout, events, news } = useData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">Admin Dashboard</h1>
        <p className="text-xl text-slate-300 mt-4">Manage your content here.</p>
      </div>
      
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome, Admin!</h2>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Logout
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Manage Events</h3>
              <p className="text-slate-300 mb-4">You currently have {events.length} events.</p>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-4 rounded transition-colors">Add New Event</button>
            </div>
             <div className="bg-slate-800/50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Manage News</h3>
              <p className="text-slate-300 mb-4">You currently have {news.length} news articles.</p>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-4 rounded transition-colors">Add New Article</button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default AdminDashboardPage;
