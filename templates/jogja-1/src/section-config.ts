import type { ComponentType } from 'react';
import { createElement } from 'react';
import { Audio, SnowfallEffect } from '@temanten/sdk';
import { assetUrl } from './lib/asset';
import { Brides } from './containers/brides';
import { Ceremony } from './containers/ceremony';
import { CeremonyAfter } from './containers/ceremony-after';
import { Comments } from './containers/comments';
import { Footer } from './containers/footer';
import { Invitation } from './containers/invitation';
import { LoveStory } from './containers/love-story';
import { SplashScreen } from './containers/welcome';
import { Gift } from './containers/gift';
import { Navigation } from './containers/navigation';
import { FloatingControls } from './containers/floating-controls';
import { GuestPhotoMoment } from './containers/photo-moment';
import { QrCheckin } from './containers/qr-checkin';

export type TemplateSectionEntry = {
  id: string;
  Component: ComponentType;
};

const TemplateAudio: ComponentType = () =>
  createElement(Audio, { src: assetUrl('/music/pawestri_cut.mp3') });

export const TEMPLATE_SECTIONS: TemplateSectionEntry[] = [
  { id: 'splash', Component: SplashScreen },
  { id: 'audio', Component: TemplateAudio },
  { id: 'snowfall', Component: SnowfallEffect },
  { id: 'navigation', Component: Navigation },
  { id: 'floating-controls', Component: FloatingControls },
  { id: 'invitation', Component: Invitation },
  { id: 'brides', Component: Brides },
  { id: 'ceremony', Component: Ceremony },
  { id: 'ceremony-after', Component: CeremonyAfter },
  { id: 'love-story', Component: LoveStory },
  { id: 'gift', Component: Gift },
  { id: 'comments', Component: Comments },
  { id: 'qr-checkin', Component: QrCheckin },
  { id: 'photo-moment', Component: GuestPhotoMoment },
  { id: 'footer', Component: Footer },
];
