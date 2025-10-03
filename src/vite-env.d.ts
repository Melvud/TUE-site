/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE?: string; // если нужно указывать иной базовый URL API
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  