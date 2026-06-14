import { WindowFrame } from '@temanten/sdk';
import { TEMPLATE_SECTIONS } from './section-config';
import { loadFonts } from './lib/fonts';
import './styles/main.css';

loadFonts();

export { manifest } from './manifest';

export const TemplatePage = () => (
  <WindowFrame>
    {TEMPLATE_SECTIONS.map(({ id, Component }) => (
      <Component key={id} />
    ))}
  </WindowFrame>
);
