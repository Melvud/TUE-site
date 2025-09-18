// src/types.ts
export interface Event {
    id: string;
    slug?: string;
    title: string;
    date: string; // ISO 8601 (дата ивента)
    image: string;
    description: string;
    content: string; // HTML
    featured?: boolean;
    published?: boolean;
    registrationLink?: string | null;
    isLatest?: boolean;          // показывать как «главный» на /events
    publishAt?: string | null;   // ISO (когда становится видимым публично)
  }
  
  export interface News {
    id: string;
    slug?: string;
    title: string;
    date: string; // ISO 8601 (дата новости)
    author: string;
    image: string;
    snippet: string;
    content: string; // HTML
    published?: boolean;
    publishAt?: string | null;   // ISO для отложенной публикации
  }
  
  export interface AuthUser {
    id: string;
    email: string;
    name?: string;
  }
  