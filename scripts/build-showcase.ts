/**
 * Compile the deterministic showcase and write it to a committed JSON artifact.
 * Run with: npm run showcase:build
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileShowcase } from "../src/showcase/compiler";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../src/showcase/data");
mkdirSync(outDir, { recursive: true });

const showcase = compileShowcase();
const outFile = join(outDir, "showcase.generated.json");
writeFileSync(outFile, `${JSON.stringify(showcase, null, 2)}\n`, "utf8");

console.log(
  `Showcase compiled: ${showcase.participants.length} participants, ` +
    `${showcase.dates.length} dates, ${showcase.rankings.length} rankings → ${outFile}`,
);
