# Mini Jarvis (family edition)

Kids: 4 (ages 19, 17, 16, 11). Phones: mostly iPhone. Parent view: the Owner, in Jarvis.
Status key: BUILT = on the server now. NEXT = planned. LATER = idea.

## Safety
- **Live family locations** (BUILT): each person runs OwnTracks (free iPhone/Android app) pointed at Jarvis. Map page `/family`, or ask "where are the kids / where is Maya".
- **Arrive and leave alerts** (BUILT): "Family: Maya arrived" for saved places (home, shop, Camden house, school). Needs 2 matching location updates in a row, so it does not flicker.
- **HELP / "Get Dad"** (BUILT): "Hey Siri, get dad" (iPhone Shortcut) sends the Owner a loud alert that repeats every minute until acknowledged and ignores silent mode. Shows who, street address, map link, GPS accuracy, driving or not (mph), battery, their number.
- **HELP test mode** (BUILT): `&test=1` sends a harmless test line.
- **Phone silent on HELP** (NEXT): the Shortcut turns on Silent/Do Not Disturb so an alarm does not give them away.
- **Backup text to Dad on HELP** (NEXT): the Shortcut also texts the location to the Owner in case Jarvis is down.
- **Emergency SOS for 911** (USE THE PHONE'S OWN): iPhone side button x5 / Android power key x3 calls 911 with location. Set the Owner as each kid's emergency contact. Jarvis never auto-dials 911.
- **Nearby Bluetooth device names** (BUILT, Owner's Android only): "what Bluetooth devices are near me". Names only, no phone numbers (Bluetooth cannot give them). Not on the kids' iPhones until there is a native kid app.
- **Check-in buttons** (NEXT): "I'm good" / "Pick me up" / "Running late" in one tap.
- **Curfew and "home in 20" nudges** (NEXT).
- **Per-kid privacy screen** (NEXT): shows each kid exactly what the Owner can see. The 19-year-old shares by agreement and can pause.

## Drivers (17 and 16, later the 19)
- **Vehicle data** (NEXT): fuel, check-engine codes, battery volts. iPhones cannot use the Bluetooth OBD dongle, so the plan is a plug-in tracker with its own SIM (such as Bouncie, API to be checked).
- **Speed and hard-braking alerts** (NEXT): shown to the driver first.
- **Crash detection alert** (LATER).
- **Who has the truck / car** (NEXT): family vehicle map.
- **Driving score for rewards** (LATER): earns gas money or truck privileges.

## Useful for the kids
- **Chores and allowance** (NEXT): the Owner assigns, they mark done, the Owner approves, the balance grows. Jarvis nags so he does not have to.
- **Reminders and bring-lists per place** (NEXT): "bring your cleats", same as the Owner's own.
- **"I need a ride"** (NEXT): goes to whichever parent is free, with their pickup spot.
- **Family-only message board with voice notes** (LATER).
- **Kid-safe Jarvis voice** (LATER): homework help, quizzes, spelling, "explain it like I'm 10", with parent-set limits.

## Fun
- **Pick the voice and name** (LATER).
- **Trivia, riddles, daily streaks** (LATER).
- **Scavenger hunts** at the house or shop (LATER).
- **Family leaderboard** (LATER): points for chores, reading, streaks; rewards set by the Owner.
- **Bedtime stories** starring the kid (LATER).
- **Photo to cartoon / story** (LATER).
- **Car-audio kid mode** (LATER): build-your-own sound system game, bass visualizer demo.

## How it works
- iPhones: OwnTracks (free) for location. iPhone Shortcut for HELP. A native iOS app (Apple developer account, $99/year) is needed later for check-ins, chores and the kid voice.
- Android: the Jarvis app already does more (Bluetooth scan, background location).
- Server: Jarvis on Railway. Each kid has a private token. No kid logs into Jarvis itself.
- Adults (the 19-year-old) must agree to share.

## Setup steps for each kid (iPhone)
1. Install OwnTracks from the App Store.
2. Settings > Connection > Mode: HTTP. URL: the link Jarvis gives for that kid (say "add Maya to the family").
3. Location: Always. Move mode on.
4. Make the "Get Dad" Shortcut (steps in HANDOFF.md, section HELP) and test with `&test=1`.
5. Set the Owner as Emergency Contact in Health > Medical ID.

## Open items
- Kids' names and phone numbers (to add them and put numbers in HELP alerts).
- Confirm which kids are on iPhone vs Android.
- Pick a vehicle tracker for the drivers.
- Decide on the native iOS app.
