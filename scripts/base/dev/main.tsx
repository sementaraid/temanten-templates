import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TemantenProvider } from '@temanten/sdk';
import { TemplatePage } from '../src/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TemantenProvider mode="demo">
      <TemplatePage />
    </TemantenProvider>
  </StrictMode>
);
