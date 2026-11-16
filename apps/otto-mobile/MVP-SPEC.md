# Otto AI mobile app: MVP spec (frozen 16 Nov 2026)

Decision (Matthew, 16 Nov 2026): the web app at lumin42.com/otto-app is the working demo now; this native
iOS/Android app is the next build. Both use the same backend (`/api/otto` in lumin42-site), so Otto's rules,
playbooks and the only quotable prices live in one place.

## Release 1 does
| Feature | Status | How it's tested |
|---|---|---|
| Home: orb, ask box, command centre tiles | Built | Screen check on iPhone and Android sizes |
| Chat in 5 spaces (Ask, Life, Business, Learn, Create) | Built | Golden evals against `/api/otto` (target 90%+, no factual zeros) |
| Read answers aloud (expo-speech, en-GB) | Built | Device test on one iPhone and one Android |
| Voice input | Keyboard dictation for now | Native speech recognition needs a development build: release 1.1 |
| My Life: tasks on the phone + "Plan my day" | Built | Add, tick, delete, restart app, list still there |
| My Business: 6 setup questions saved on the phone, sent with each question | Built | Answer uses the saved details |
| Learn: explain or quiz on any topic | Built | Golden evals (learn set to be written) |
| Honesty flags (price not in catalogue, claimed actions) | Built (server) | Unit test in lumin42-site, shown under the answer |
| Delete my data (About → Delete my data) | Built | Data gone after restart |

## Release 1 does NOT do
- Sign-in, accounts or sync between devices (everything is on the phone).
- Memory on a server, email or calendar access, or actions in any other app.
- Subscriptions or payments. No subscription tiers are in the vault yet; Matthew decides them before RevenueCat or store billing is added.
- Web (already covered by lumin42.com/otto-app).

## Before App Store / Google Play
1. Run the golden evals against `/api/otto` and fix failures.
2. Device test on one real iPhone and one Android phone (Expo Go or an EAS development build).
3. Privacy policy page on lumin42.com covering the app; App Store privacy labels (data: messages sent to lumin42 and Anthropic to answer, not stored by lumin42).
4. Apple Developer Program (USD 99 a year) and Google Play developer account (one-off fee): Matthew's accounts, Matthew pays.
5. Apple rejects apps that are only a wrapped website: release 1 is native screens, on-phone storage and read-aloud, which helps; native voice input in 1.1 helps more.

## Next build (1.1)
Native voice input, sign-in (Supabase or similar, to be decided), user-controlled memory with view/edit/delete, then subscriptions once tiers are in the vault.
