# leonida-trophy-guide
[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/verad-xe/leonida-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/verad-xe/leonida-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend is an offline trophy guide and tracker for all 55 official PlayStation 5 trophies of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver and 46 bronze. Every trophy carries its official name, description and grade exactly as PlayStation publishes them, plus an original guide in our own words, concrete steps, a kind, a roadmap stage, a missable flag with its reason where one applies, and a named source citation. Where an official description is deliberately cryptic, the guide says so and labels its interpretation as an inference rather than dressing a guess up as a fact.

The tracker saves your progress in the browser, shows per-grade counts and a progress bar, and exports, imports and resets that progress as JSON. Search and filters by grade, kind, status and missable-only narrow the list in a keystroke, and spoiler protection — on by default — hides the names and descriptions of story trophies until you earn them. A six-stage platinum roadmap (story first, strands, the 100% push, collectibles and counters, money and property, then cleanup) orders the whole run, and a dedicated Missables view gathers the eleven trophies that can be locked out, with the save strategy that defeats them.

Everything runs offline from the static files under `app/`: no build step, no accounts, no network requests, and no Rockstar Games artwork — the look is original CSS with system fonts.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step and no network requests: everything the guide loads is under app/.

---
<sub>Entered on [make.fun](https://make.fun/?ref=05egkt5w&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
