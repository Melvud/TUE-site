
export interface TeamMember {
  name: string;
  position: string;
  image: string;
  socials: {
    linkedin?: string;
    email?: string;
  };
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  featured?: boolean;
  registrationLink?: string;
  content: string;
}

export interface News {
  id: string;
  title: string;
  date: string;
  author: string;
  image: string;
  snippet: string;
  content: string;
}
