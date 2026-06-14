import { assetUrl } from "./asset";

function load(
  family: string,
  file: string,
  descriptors?: FontFaceDescriptors,
): Promise<void> {
  const url =  assetUrl('/fonts/' + file);
  const face = new FontFace(family, `url("${url}") format("truetype")`, {
    display: 'swap',
    ...descriptors,
  });
  return face.load().then((f) => {
    document.fonts.add(f);
  });
}

const OPEN_SANS_VARIANTS: Array<[string, FontFaceDescriptors]> = [
  ['open-sans/static/OpenSans-Light.ttf', { weight: '300' }],
  ['open-sans/static/OpenSans-Regular.ttf', { weight: '400' }],
  ['open-sans/static/OpenSans-Medium.ttf', { weight: '500' }],
  ['open-sans/static/OpenSans-SemiBold.ttf', { weight: '600' }],
  ['open-sans/static/OpenSans-Bold.ttf', { weight: '700' }],
  ['open-sans/static/OpenSans-ExtraBold.ttf', { weight: '800' }],
  ['open-sans/static/OpenSans-LightItalic.ttf', { weight: '300', style: 'italic' }],
  ['open-sans/static/OpenSans-Italic.ttf', { weight: '400', style: 'italic' }],
  ['open-sans/static/OpenSans-MediumItalic.ttf', { weight: '500', style: 'italic' }],
  ['open-sans/static/OpenSans-SemiBoldItalic.ttf', { weight: '600', style: 'italic' }],
  ['open-sans/static/OpenSans-BoldItalic.ttf', { weight: '700', style: 'italic' }],
  ['open-sans/static/OpenSans-ExtraBoldItalic.ttf', { weight: '800', style: 'italic' }],
];

const OPEN_SANS_CONDENSED_VARIANTS: Array<[string, FontFaceDescriptors]> = [
  ['open-sans/static/OpenSans_Condensed-Light.ttf', { weight: '300', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-Regular.ttf', { weight: '400', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-Medium.ttf', { weight: '500', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-SemiBold.ttf', { weight: '600', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-Bold.ttf', { weight: '700', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-ExtraBold.ttf', { weight: '800', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-LightItalic.ttf', { weight: '300', style: 'italic', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-Italic.ttf', { weight: '400', style: 'italic', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-MediumItalic.ttf', { weight: '500', style: 'italic', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-SemiBoldItalic.ttf', { weight: '600', style: 'italic', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-BoldItalic.ttf', { weight: '700', style: 'italic', stretch: 'condensed' }],
  ['open-sans/static/OpenSans_Condensed-ExtraBoldItalic.ttf', { weight: '800', style: 'italic', stretch: 'condensed' }],
];

const OPEN_SANS_SEMICONDENSED_VARIANTS: Array<[string, FontFaceDescriptors]> = [
  ['open-sans/static/OpenSans_SemiCondensed-Light.ttf', { weight: '300', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-Regular.ttf', { weight: '400', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-Medium.ttf', { weight: '500', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-SemiBold.ttf', { weight: '600', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-Bold.ttf', { weight: '700', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-ExtraBold.ttf', { weight: '800', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-LightItalic.ttf', { weight: '300', style: 'italic', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-Italic.ttf', { weight: '400', style: 'italic', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-MediumItalic.ttf', { weight: '500', style: 'italic', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-SemiBoldItalic.ttf', { weight: '600', style: 'italic', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-BoldItalic.ttf', { weight: '700', style: 'italic', stretch: 'semi-condensed' }],
  ['open-sans/static/OpenSans_SemiCondensed-ExtraBoldItalic.ttf', { weight: '800', style: 'italic', stretch: 'semi-condensed' }],
];

export function loadFonts(): Promise<void> {
  const promises: Promise<void>[] = [
    load('Arashveti', 'arashveti-font/Arashveti-EapnW.ttf'),
    ...OPEN_SANS_VARIANTS.map(([file, desc]) => load('Open Sans', file, desc)),
    ...OPEN_SANS_CONDENSED_VARIANTS.map(([file, desc]) => load('Open Sans Condensed', file, desc)),
    ...OPEN_SANS_SEMICONDENSED_VARIANTS.map(([file, desc]) => load('Open Sans SemiCondensed', file, desc)),
  ];

  return Promise.allSettled(promises).then((results) => {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`Font load failed [${i}]:`, result.reason);
      }
    });
  });
}
