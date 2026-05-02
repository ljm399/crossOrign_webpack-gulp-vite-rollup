import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

export function mountReact(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
