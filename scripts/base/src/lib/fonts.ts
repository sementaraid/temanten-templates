import { assetUrl } from './asset';

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

export function loadFonts(): Promise<void> {
  const fonts: Promise<void>[] = [
    // loadFont('My Font', 'my-font/MyFont-Regular.ttf'),
  ];
  return Promise.allSettled(fonts).then(() => {});
}
