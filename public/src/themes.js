// Colour themes. Every value can be blended smoothly (see sky.js). Add your own here.
// Colours are hex. win = how strongly building windows glow (0 off .. 1.4 bright).
export const THEMES = {
  crimson: { label: 'Crimson Night', domeTop: 0x070a1c, domeMid: 0x2b2547, domeHor: 0x6b3454, fog: 0x1a1530, fogNear: 40, fogFar: 190,
    moon: 0xe0788c, halo: 0xd84b78, haloA: .18, hemiSky: 0x7f8fd8, hemiGnd: 0x2a1d33, hemiI: .9, sun: 0xf2a2b8, sunI: 1.4,
    ground: 0x24302c, exposure: 1.15, bld: 0xffffff, win: 1.0, stars: .8, lamp: 0xffd7a0 },
  blue:    { label: 'Blue Moonlight', domeTop: 0x050c24, domeMid: 0x14305e, domeHor: 0x3f6fa8, fog: 0x10203f, fogNear: 45, fogFar: 200,
    moon: 0xdfe8ff, halo: 0x8fb4ff, haloA: .2, hemiSky: 0x86a8ff, hemiGnd: 0x1b2a3a, hemiI: 1.0, sun: 0xb9d0ff, sunI: 1.5,
    ground: 0x1e3030, exposure: 1.2, bld: 0xe6f0ff, win: 1.1, stars: 1, lamp: 0xffe2b0 },
  dusk:    { label: 'Violet Dusk', domeTop: 0x1a1240, domeMid: 0x6a3a7c, domeHor: 0xf08a6a, fog: 0x4a2a55, fogNear: 35, fogFar: 170,
    moon: 0xffd0a8, halo: 0xff9a6a, haloA: .22, hemiSky: 0xc59aff, hemiGnd: 0x3a2236, hemiI: 1.0, sun: 0xffb27a, sunI: 1.7,
    ground: 0x2c3326, exposure: 1.2, bld: 0xfff0e6, win: .7, stars: .35, lamp: 0xffc890 },
  dawn:    { label: 'Silver Dawn', domeTop: 0x3a5a8f, domeMid: 0x9bb6d8, domeHor: 0xffd9bd, fog: 0xb9c4d8, fogNear: 50, fogFar: 230,
    moon: 0xf4f1ff, halo: 0xffffff, haloA: .12, hemiSky: 0xcfe2ff, hemiGnd: 0x5a5a60, hemiI: 1.25, sun: 0xffe2c0, sunI: 2.0,
    ground: 0x3a5238, exposure: 1.05, bld: 0xffffff, win: 0, stars: 0, lamp: 0xfff0d0 }
};
export const THEME_KEYS = Object.keys(THEMES);
// soft tints baked into every house (multiplied with the Kenney colours)
export const TINTS = [0xffffff, 0xffe6cf, 0xd9ecff, 0xffd9ea, 0xdcffe6, 0xfff2b8, 0xe5dcff, 0xffd0c0];
