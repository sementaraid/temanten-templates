import { assetUrl } from './asset';

// Loads a single font face from the template's public/fonts/ directory.
// `file` is relative to public/fonts/ (e.g. 'open-sans/OpenSans-Regular.ttf').
// `descriptors` maps to FontFaceDescriptors: weight, style, stretch, display, etc.
//
// Example — loading a multi-weight font family:
//
//   loadFont('Open Sans', 'open-sans/OpenSans-Regular.ttf', { weight: '400' })
//   loadFont('Open Sans', 'open-sans/OpenSans-Bold.ttf',    { weight: '700' })
//
// Use the returned promise array in loadFonts() below.
function loadFont(
  family: string,
  file: string,
  descriptors?: FontFaceDescriptors,
): Promise<void> {
  const url = assetUrl('/fonts/' + file);
  const face = new FontFace(family, `url("${url}") format("truetype")`, {
    display: 'swap',
    ...descriptors,
  });
  return face.load().then((f) => { document.fonts.add(f); });
}

// Called once at template mount time (see src/index.tsx).
// Add every font your template uses here; failures are logged but never throw.
//
// Scaffold:
//   loadFont('My Brand Font', 'my-brand/MyBrandFont-Regular.ttf'),
//   loadFont('My Brand Font', 'my-brand/MyBrandFont-Bold.ttf', { weight: '700' }),
export function loadFonts(): Promise<void> {
  const fonts: Promise<void>[] = [
    // Replace the examples below with your template's actual fonts:
    // loadFont('My Font', 'my-font/MyFont-Regular.ttf'),
    // loadFont('My Font', 'my-font/MyFont-Bold.ttf', { weight: '700' }),
  ];
  return Promise.allSettled(fonts).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.warn(`[loadFonts] font[${i}] failed:`, r.reason);
    });
  });
}
