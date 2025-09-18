
import React from 'react';
import Section from '../components/Section';

const JoinUsPage: React.FC = () => {
  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">Join PhE</h1>
        <p className="text-xl text-slate-300 mt-4">Become a member and unlock exclusive benefits!</p>
      </div>

      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          <div className="text-lg text-slate-300 space-y-6">
            <h3 className="text-3xl font-bold text-white">Why become a <span className="text-cyan-400">PhE member?</span></h3>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Free Optica subscription (1 year for postdocs, 3 years for PhDs).</li>
              <li>Access to exclusive workshops and company visits.</li>
              <li>Networking opportunities with peers and industry professionals.</li>
              <li>Invitations to fun, sponsored social activities.</li>
              <li>A chance to be part of a vibrant photonics community.</li>
            </ul>
            <p>Ready to be part of the future of photonics? Fill out the form to join us!</p>
          </div>
          
          <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl">
            <form action="https://formspree.io/f/your_form_id" method="POST" className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input type="text" name="name" id="name" required className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <input type="email" name="email" id="email" required className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/>
              </div>
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-slate-300 mb-1">Education/Employment Level</label>
                <select id="level" name="level" className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500 transition">
                  <option>Bachelors</option>
                  <option>Masters</option>
                  <option>PhD</option>
                  <option>Postdoc</option>
                  <option>Staff/Faculty</option>
                  <option>Other</option>
                </select>
              </div>
               <div>
                <label htmlFor="department" className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                <select id="department" name="department" className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500 transition">
                  <option>Applied Physics</option>
                  <option>Electrical Engineering</option>
                  <option>Computer Science</option>
                  <option>Biotechnology</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-6 rounded-md transition-transform duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30">
                  Become a Member
                </button>
              </div>
            </form>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default JoinUsPage;
