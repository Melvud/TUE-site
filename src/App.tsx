// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';

import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';

import JoinUsPage from './pages/JoinUsPage';
import ContactPage from './pages/ContactPage';

// ВНИМАНИЕ: никаких импортов старой админки.
// Payload Admin живёт по пути /admin на сервере и не должен перехватываться SPA.

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            {/* Основные страницы */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Events */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />

            {/* News */}
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />

            {/* Join / Contact */}
            <Route path="/join" element={<JoinUsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* 404 → на главную (не перехватываем /admin !) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
