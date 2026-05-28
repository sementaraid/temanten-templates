import { WindowFrame, WindowTemplate } from '@temanten/sdk';
import { TEMPLATE_SECTIONS } from './section-config';
import { loadFonts } from './lib/fonts';
import './styles/main.css';

loadFonts();

export { manifest } from './manifest';

export const TemplatePage = () => (
  <WindowFrame className='w-full m-auto relative max-w-screen-sm'>
    <WindowTemplate className='bg-[#f5f5dc] dark:bg-[#1a0e05] text-gray-900 dark:text-gray-100 transition-colors duration-300'>
      {TEMPLATE_SECTIONS.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </WindowTemplate>
  </WindowFrame>
);
