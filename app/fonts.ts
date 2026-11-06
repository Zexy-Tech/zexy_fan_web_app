import { Lato } from 'next/font/google';

// The app's only typeface. Self-hosted by next/font at build time (no runtime Google request).
// Regular + bold are used everywhere, so they are preloaded.
export const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

// Black (900) appears on only a few screens (login/PIN headings, billing totals). next/font preloads
// every weight it declares, which made browsers warn "preloaded but not used" on all other pages, so it
// lives in its own family that downloads only when a `font-black` element renders (see globals.css).
export const latoBlack = Lato({
  subsets: ['latin'],
  weight: '900',
  variable: '--font-lato-black',
  display: 'swap',
  preload: false,
});
