import { WindowFrame } from '@temanten/sdk';
import { TEMPLATE_SECTIONS } from './section-config';
import './styles/main.css';

export { manifest } from './manifest';

export const TemplatePage = () => (
  <WindowFrame>
    {TEMPLATE_SECTIONS.map(({ id, Component }) => (
      <Component key={id} />
    ))}
  </WindowFrame>
);
