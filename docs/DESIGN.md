# Design notes

## Identity
A chunky "toy console" look: thick ink outlines, hard offset shadows, three saturated game colours
(orange, mint, pink) and one accent (blue). Display type is Bowlby One, body type is DM Sans.
All colours are CSS variables, with light and dark themes that follow the system setting.

## Interaction and motion
Every animation answers a player action, and none is decorative only.

| Moment | Feedback | Why |
| --- | --- | --- |
| Memory card flip | 3D rotation, bounce on match | Shows which two cards are in play |
| Tic-Tac-Toe move | Mark pops in; the next Vanishing mark fades | Makes the new rule readable at a glance |
| Snake eats or collects | Particle burst, pulsing apple, power-up timer | Confirms the pickup and the effect |
| Win or new best | Confetti, sound, phone vibration, XP toast | Rewards the result without blocking play |
| Changing screens | Short cross-fade (View Transitions API) | Keeps orientation between games |

Motion is skipped when the user prefers reduced motion.

## Phone first
Designed and checked on a 360 px wide Android phone. Rule: each game's board and controls fit on one
screen without scrolling. That drove the compact header, the title sitting in the same row as Back and New,
and a Snake canvas drawn at the device's pixel ratio so it stays sharp.

## Accessibility
- Text contrast, measured: body 15.0:1, helper text 5.5:1, ink on orange 6.9:1, ink on mint 7.8:1,
  ink on pink 5.8:1, white on blue 5.8:1 (all above the 4.5:1 minimum).
- Full keyboard play, a skip link, live regions for game status, and focus moved to the heading on navigation.
- Cards and squares have descriptive labels, for example "Square 3, X, fades next".

## Known gaps
- Header buttons are about 35 px tall, under the 44 px touch-target guideline.
- Not tested with a screen reader, and dark mode has not been reviewed on a device.
- Scores come from the browser, so the leaderboard is for fun rather than competitive play.
