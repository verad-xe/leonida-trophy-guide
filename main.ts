// Leonida Legend hand-in program.
// Copies the offline guide in app/ and any screenshots/ beside this file
// into the output directory, then writes the dossier the scorer reads.
// Node 22, standard library only, plus the vendored make.fun library.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Pre-flight self-check: fail early with a clear message instead of
// handing in a broken guide. Both data files must parse, the trophy
// list must hold exactly 55 entries, and screenshots must respect the
// dossier caps (at most 4 files, each at most 262144 bytes).
function preflight(root) {
  for (const rel of ['app/data/trophies.json', 'app/data/roadmap.json']) {
    try {
      JSON.parse(readFileSync(join(root, rel), 'utf8'));
    } catch (err) {
      throw new Error('pre-flight failed: ' + rel + ' is not valid JSON (' + err.message + ')');
    }
  }
  const data = JSON.parse(readFileSync(join(root, 'app/data/trophies.json'), 'utf8'));
  if (!Array.isArray(data.trophies) || data.trophies.length !== 55) {
    throw new Error('pre-flight failed: expected exactly 55 trophies, found ' + (data.trophies ? data.trophies.length : 'none'));
  }
  const shotsDir = join(root, 'screenshots');
  if (existsSync(shotsDir)) {
    const shots = readdirSync(shotsDir).filter((f) => /\.(?:png|jpe?g)$/i.test(f));
    if (shots.length > 4) throw new Error('pre-flight failed: ' + shots.length + ' screenshots, over the cap of 4');
    for (const f of shots) {
      const size = statSync(join(shotsDir, f)).size;
      if (size > 262144) throw new Error('pre-flight failed: screenshot ' + f + ' is ' + size + ' bytes, over 262144');
    }
  }
}

// Directory that contains this file, and where the hand-in goes.
const here = fileURLToPath(new URL('.', import.meta.url));
preflight(here);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Make sure the output root exists before copying anything into it.
mkdirSync(outDir, { recursive: true });

// The guide itself: static files, no build step at serve time.
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });

// Screenshots are expected by the dossier, so always create the target.
// Only copy when the source folder is present in this repository.
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shotsSource = join(here, 'screenshots');
if (existsSync(shotsSource)) {
  cpSync(shotsSource, join(outDir, 'screenshots'), { recursive: true });
}

// Write the dossier with the exact caps the scorer uses, so a local run
// fails in the same places the scorer would refuse the entry.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
