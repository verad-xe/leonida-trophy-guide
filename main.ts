// Leonida trophy guide — the hand-in program.
//
// Running this file prepares the finished entry in an output folder:
//
//   1. It works out two places: where this guide lives (the folder beside
//      this file) and where the hand-in belongs — the directory named by
//      MAKEFUN_OUTPUT_DIR when that is set, and /output when it is not.
//   2. It copies the guide itself across: the static site under app/ and
//      the captures under screenshots/.
//   3. It asks the vendored dossier builder to describe what now sits in
//      the output folder, and stores that description as dossier.json
//      there for the scorer to read.
//
// Nothing here reaches the network, and nothing beyond Node's standard
// library is used apart from the one vendored import below.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The folder this file sits in; app/ and screenshots/ live alongside it.
const guideHome = fileURLToPath(new URL('.', import.meta.url));

// The destination for the hand-in.
function pickDestination(): string {
  const named = process.env.MAKEFUN_OUTPUT_DIR;
  return named === undefined ? '/output' : named;
}

// Bring one named directory tree over into the destination. The target
// folder is created either way; the copy itself happens only when the
// source tree is actually present.
function bringTreeAcross(name: string, destination: string): void {
  const target = join(destination, name);
  mkdirSync(target, { recursive: true });
  const origin = join(guideHome, name);
  if (existsSync(origin)) {
    cpSync(origin, target, { recursive: true });
  }
}

const outDir = pickDestination();
mkdirSync(outDir, { recursive: true });
cpSync(join(guideHome, 'app'), join(outDir, 'app'), { recursive: true });
bringTreeAcross('screenshots', outDir);

// The limits passed to the dossier builder. They mirror the scorer's own
// gate: the text cap shapes how many bytes of source the dossier carries,
// while the remaining caps simply make this program refuse an entry the
// scorer would refuse anyway — more screenshots than allowed, a single
// screenshot that is too large, or an app/ tree holding too many entries
// or too many bytes in total.
const capsForDossier = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, capsForDossier));
