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
} catch {
  // Ignore in environments without localStorage
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
