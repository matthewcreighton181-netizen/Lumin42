# Otto AI (iOS and Android)

Native app for Otto, lumin42's AI companion. Expo SDK 58, React Native, TypeScript. Scope and test plan: [MVP-SPEC.md](MVP-SPEC.md).

## Run it on your phone
1. Install **Expo Go** from the App Store or Google Play.
2. On the Mac: `cd apps/otto-mobile && npm install && npx expo start`
3. Scan the QR code with the phone camera (iPhone) or Expo Go (Android).

The app talks to `https://lumin42.com/api/otto`, so the Otto backend in lumin42-site must be deployed first.
To point it somewhere else (for example `netlify dev`), set `EXPO_PUBLIC_OTTO_API`.

## Checks before any commit
`npx tsc --noEmit`

## Files
- `App.tsx`: all screens (Home, Chat, Life, Business, Learn) and the tab bar.
- `src/api.ts`: the one call to Otto's backend.
- `src/store.ts`: on-phone storage (tasks, business details, chat history).
- `src/theme.ts`: colours.
