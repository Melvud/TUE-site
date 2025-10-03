// src/types.ts

// ============ Core Content Types ============

export interface Event {
  id: string | number;
  slug?: string;
  title: string;
  date: string; // ISO 8601 или YYYY-MM-DD или YYYY-MM-DD..YYYY-MM-DD для диапазона
  coverUrl?: string;
  image?: string; // для обратной совместимости
  googleFormUrl?: string;
  summary?: string;
  description?: string; // для обратной совместимости
  content: string; // HTML
  published?: boolean;
  latest?: boolean; // флаг featured/latest события
  publishAt?: string | null; // ISO для отложенной публикации
  createdAt?: string;
  updatedAt?: string;
}

export interface News {
  id: string | number;
  slug?: string;
  title: string;
  date: string; // ISO 8601
  author?: string;
  coverUrl?: string;
  image?: string; // для обратной совместимости
  summary?: string;
  snippet?: string; // для обратной совместимости
  content: string; // HTML
  published?: boolean;
  publishAt?: string | null; // ISO для отложенной публикации
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id?: string | number;
  name: string;
  position?: string; // для обратной совместимости
  role?: string;
  image?: string; // для обратной совместимости
  photoUrl?: string;
  socials?: {
    linkedin?: string;
    email?: string;
    instagram?: string;
  };
  linkedin?: string;
  email?: string;
  instagram?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============ Auth Types ============

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

// ============ Pages Content Types ============

export interface HomePageContent {
  typedPhrases: string[];
  heroImage: string;
}

export interface AboutSection {
  id: string;
  type: 'text-image' | 'image-text';
  title: string;
  text: string; // HTML
  image: string;
}

export interface AboutPageContent {
  sections: AboutSection[];
}

export interface JoinFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[]; // для select
}

export interface JoinUsPageContent {
  /**
   * Introductory content shown above the join form. This can include a brief welcome
   * message or instructions. HTML is allowed.
   */
  introText: string;
  /**
   * Additional rich HTML content describing membership tiers, benefits and how to join.
   * When unset, the admin UI will fall back to a sensible default with details about
   * PhE membership options and Optica student membership. Editors can customise this
   * freely to match the organisation’s offerings.
   */
  detailsHtml?: string;
  /**
   * Dynamic list of fields shown in the join form. Admins can add or remove fields
   * as needed. Each field has a name, label, type and other metadata.
   */
  formFields: JoinFormField[];
}

// ============ API Response Types ============

export interface ApiError {
  error: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface UploadResponse {
  url: string;
}

// ============ Utility Types ============

export type ContentStatus = 'draft' | 'published' | 'scheduled';

export interface TimestampedContent {
  createdAt: string;
  updatedAt: string;
}

export interface PublishableContent {
  published: boolean;
  publishAt?: string | null;
}
