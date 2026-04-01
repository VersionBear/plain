import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { setupVisibilityHandlers } from './utils/visibilityHandler';
import './index.css';

// Set up visibility handlers to save state when app is backgrounded
// This is critical for mobile PWAs where the app can be backgrounded at any time
setupVisibilityHandlers();

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
