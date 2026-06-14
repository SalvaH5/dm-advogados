import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './store/themeStore'; // inicializa tema salvo

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
