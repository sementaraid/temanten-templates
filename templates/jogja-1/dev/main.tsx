/**
 * Standalone dev harness for the jogja-1 template.
 * Run with: pnpm dev
 *
 * Wraps the template in a real TemantenProvider from @temanten/sdk so all
 * hooks (useTemantenStore, useUIStore, etc.) work without the main app.
 */
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
