
import React from 'react';
import Section from '../components/Section';

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);
const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);


const ContactPage: React.FC = () => {
  return (
    <div className="bg-slate-900">
      <div className="relative pt-32 pb-16 text-center text-white">
        <h1 className="text-5xl font-extrabold">Contact Us</h1>
        <p className="text-xl text-slate-300 mt-4">Have questions? We'd love to hear from you.</p>
      </div>

      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Send us a message</h3>
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
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                <textarea name="message" id="message" rows={5} required className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500 transition"></textarea>
              </div>
              <div>
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-6 rounded-md transition-transform duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30">
                  Send Message
                </button>
              </div>
            </form>
          </div>
          
          <div className="text-lg text-slate-300 space-y-8">
             <h3 className="text-2xl font-bold text-white">Contact Details</h3>
             <div>
                <div className="flex items-start">
                    <LocationIcon />
                    <div>
                        <h4 className="font-semibold text-white">Address</h4>
                        <p className="text-slate-400">Flux 2.108 Secretary PSN/AND,<br/>De Rondom 70, 5612AP<br/>Eindhoven, The Netherlands</p>
                    </div>
                </div>
             </div>
             <div>
                <div className="flex items-start">
                    <MailIcon />
                    <div>
                        <h4 className="font-semibold text-white">Email</h4>
                        <a href="mailto:photonics.society.eindhoven@tue.nl" className="text-slate-400 hover:text-cyan-400 transition-colors">photonics.society.eindhoven@tue.nl</a>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default ContactPage;
