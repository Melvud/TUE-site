
import { TeamMember, Event, News } from './types';

export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Events', path: '/events' },
  { name: 'News', path: '/news' },
  { name: 'Join Us', path: '/join' },
  { name: 'Contact', path: '/contact' },
];

export const CURRENT_TEAM: TeamMember[] = [
  {
    name: 'Dr. Evelyn Reed',
    position: 'President',
    image: 'https://i.pravatar.cc/150?u=evelyn',
    socials: { linkedin: '#', email: 'e.reed@phe.tue.nl' },
  },
  {
    name: 'Marco Luzzini',
    position: 'Vice-President',
    image: 'https://i.pravatar.cc/150?u=marco',
    socials: { linkedin: '#', email: 'm.luzzini@phe.tue.nl' },
  },
  {
    name: 'Aisha Khan',
    position: 'Secretary',
    image: 'https://i.pravatar.cc/150?u=aisha',
    socials: { linkedin: '#', email: 'a.khan@phe.tue.nl' },
  },
  {
    name: 'Leo Petrov',
    position: 'Treasurer',
    image: 'https://i.pravatar.cc/150?u=leo',
    socials: { linkedin: '#', email: 'l.petrov@phe.tue.nl' },
  },
];

export const PAST_TEAM: TeamMember[] = [
    { name: 'Dr. Alex Chen', position: 'Past President', image: 'https://i.pravatar.cc/150?u=alex', socials: {} },
    { name: 'Sofia Rodriguez', position: 'Past Vice-President', image: 'https://i.pravatar.cc/150?u=sofia', socials: {} },
    { name: 'Ben Carter', position: 'Past Secretary', image: 'https://i.pravatar.cc/150?u=ben', socials: {} },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'htx-2025',
    title: 'High-Tech Exchange 2025',
    date: 'October 15, 2025',
    description: 'Join us for the premier event connecting students with leading high-tech companies in the photonics industry. A full day of networking, workshops, and company presentations.',
    image: 'https://picsum.photos/seed/event1/800/600',
    featured: true,
    registrationLink: '#',
    content: '<p>The High-Tech Exchange is our flagship event, designed to bridge the gap between academia and industry. This year, we are proud to host over 30 companies from the Brainport region and beyond. Attendees will have the unique opportunity to engage in one-on-one sessions with recruiters, participate in hands-on workshops, and learn about the latest innovations in photonics. The event will conclude with a networking reception.</p>'
  },
  {
    id: 'photonics-workshop',
    title: 'Workshop: Advanced Optical Simulations',
    date: 'November 22, 2024',
    description: 'A hands-on workshop covering the latest software and techniques for simulating complex photonic devices.',
    image: 'https://picsum.photos/seed/event2/800/600',
    content: '<p>This full-day workshop is suitable for PhD students and Postdocs with a basic understanding of optics. We will cover advanced topics in FDTD and FEM simulations. Laptops with pre-installed software are required. Lunch and coffee will be provided.</p>'
  },
  {
    id: 'company-visit-asml',
    title: 'Company Visit: ASML',
    date: 'September 5, 2024',
    description: 'An exclusive tour of the ASML facilities, a world leader in the semiconductor industry.',
    image: 'https://picsum.photos/seed/event3/800/600',
    content: '<p>Discover the cutting-edge technology behind modern microchips. This visit includes a presentation by ASML engineers, a tour of their experience center, and a Q&A session. Limited spots are available, so register early!</p>'
  },
  {
    id: 'social-gathering-summer',
    title: 'PhE Summer BBQ',
    date: 'August 16, 2024',
    description: 'Let\'s celebrate the summer with a fun and informal BBQ. A great opportunity to network with fellow members.',
    image: 'https://picsum.photos/seed/event4/800/600',
    content: '<p>Join us for an evening of good food, drinks, and conversation at the university campus. We will provide a variety of food options, including vegetarian and vegan. Please RSVP so we can get a headcount.</p>'
  }
];

export const MOCK_NEWS: News[] = [
  {
    id: 'new-board-elected',
    title: 'New PhE Board Elected for 2024-2025',
    date: 'July 1, 2024',
    author: 'PhE Admin',
    image: 'https://picsum.photos/seed/news1/800/600',
    snippet: 'We are thrilled to announce the new board for the upcoming academic year. Meet the team that will be leading our society forward!',
    content: '<p>Following our annual general meeting, the votes have been tallied and we are excited to introduce the new board of the Photonics Society Eindhoven. The team is eager to build on the successes of the past year and has a packed schedule of events planned. We would also like to extend our heartfelt thanks to the outgoing board for their dedication and hard work.</p>'
  },
  {
    id: 'htx-2024-recap',
    title: 'Recap: A Successful High-Tech Exchange 2024',
    date: 'October 20, 2023',
    author: 'Jane Doe',
    image: 'https://picsum.photos/seed/news2/800/600',
    snippet: 'Last week\'s High-Tech Exchange was a resounding success, with record attendance from both students and companies.',
    content: '<p>With over 200 attendees, the 2024 High-Tech Exchange was our biggest yet. The event featured keynote speeches from industry leaders, engaging workshops, and a bustling exhibition floor. Feedback has been overwhelmingly positive, and we are already looking forward to making next year\'s event even better.</p>'
  },
  {
    id: 'optica-grant-win',
    title: 'PhE Awarded Optica Outreach Grant',
    date: 'June 5, 2023',
    author: 'John Smith',
    image: 'https://picsum.photos/seed/news3/800/600',
    snippet: 'Our chapter has received a prestigious grant from Optica to support our outreach activities in local schools.',
    content: '<p>We are proud to announce that our proposal for a series of photonics workshops for high school students has been funded by an Optica outreach grant. This funding will allow us to purchase new demonstration kits and expand our program to reach more students in the Eindhoven area, inspiring the next generation of scientists and engineers.</p>'
  }
];
