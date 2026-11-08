import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Immediate synchronous theme initialization to eliminate any flash of unstyled theme
try {
  const cachedTheme = localStorage.getItem('guro_theme');
  if (cachedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
    if (document.body) document.body.classList.add('light-mode');
  } else {
    document.documentElement.classList.remove('light-mode');
    if (document.body) document.body.classList.remove('light-mode');
  }

  const cachedAccent = localStorage.getItem('guro_accent_theme') || 'blue';
  document.documentElement.setAttribute('data-accent-theme', cachedAccent);
  if (document.body) document.body.setAttribute('data-accent-theme', cachedAccent);

  const cachedFontScale = localStorage.getItem('guro_font_scale');
  if (cachedFontScale && cachedFontScale !== 'normal') {
    document.documentElement.setAttribute('data-font-scale', cachedFontScale);
  }
} catch {
  // Ignore in environments without localStorage
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
