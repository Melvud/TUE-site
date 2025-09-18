
import React from 'react';
import { Link } from 'react-router-dom';
import { NAV_LINKS } from '../constants';

const LinkedInIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
             <div className="text-2xl font-bold text-white">
                <Link to="/">
                    <span className="text-cyan-400">Ph</span>E
                </Link>
             </div>
             <p className="text-slate-500 mt-2">Photonics Society Eindhoven</p>
          </div>
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex space-x-6 mb-4 md:mb-0 md:mr-8">
              {NAV_LINKS.slice(1).map(link => (
                 <Link key={link.name} to={link.path} className="text-slate-400 hover:text-cyan-400 transition-colors">
                    {link.name}
                 </Link>
              ))}
            </div>
            <a href="https://www.linkedin.com/company/photonics-society-eindhoven/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">
              <LinkedInIcon />
            </a>
          </div>
        </div>
        <div className="text-center text-slate-500 mt-8 pt-8 border-t border-slate-800">
          <p>&copy; {new Date().getFullYear()} Photonics Society Eindhoven. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
