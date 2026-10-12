// Demo build (prezentace): `EXPO_PUBLIC_DEMO=1 npx expo start`. Bez profilu rovnou demo profil (žádný onboarding)
// a v lekci jde přeskočit každý cvik i běžící časovač, i u profilu, který demo není.
export const DEMO_BUILD = process.env.EXPO_PUBLIC_DEMO === '1';
