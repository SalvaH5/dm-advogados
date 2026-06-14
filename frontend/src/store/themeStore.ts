import { create } from 'zustand';

interface ThemeState {
  tema: 'claro' | 'escuro';
  toggleTema: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  tema: (localStorage.getItem('dm_tema') as 'claro' | 'escuro') || 'claro',
  toggleTema: () => {
    const novo = get().tema === 'claro' ? 'escuro' : 'claro';
    localStorage.setItem('dm_tema', novo);
    document.documentElement.classList.toggle('dark', novo === 'escuro');
    set({ tema: novo });
  },
}));

// Aplica tema salvo ao carregar
const temaSalvo = localStorage.getItem('dm_tema');
if (temaSalvo === 'escuro') {
  document.documentElement.classList.add('dark');
}
