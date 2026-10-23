import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
import './index.css';
import App from './App.jsx';
import { UIProvider } from './state/UIContext.jsx';
import { VaultProvider } from './state/VaultContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UIProvider>
      <VaultProvider>
        <App />
      </VaultProvider>
    </UIProvider>
  </StrictMode>,
);
