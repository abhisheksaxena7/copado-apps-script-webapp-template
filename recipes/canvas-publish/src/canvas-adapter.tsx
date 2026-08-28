import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../../src/App';

declare const __APP_CONFIG__: {
  storageKey: string;
};

const root = document.getElementById('canvas-root');
if (!root) throw new Error('Canvas adapter expected #canvas-root.');
if (typeof App !== 'function') throw new Error('src/App.tsx must default-export a React component.');

createRoot(root).render(
  <React.StrictMode>
    <App storageKey={__APP_CONFIG__.storageKey} />
  </React.StrictMode>,
);
