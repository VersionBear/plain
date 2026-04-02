import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distAssetsDir = join(process.cwd(), 'dist', 'assets');
const maxEntryBundleBytes = 525_000;

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

const entryBundleFile = readdirSync(distAssetsDir).find(
  (fileName) => /^index-.*\.js$/.test(fileName),
);

if (!entryBundleFile) {
  console.error('Bundle budget check could not find the main entry bundle.');
  process.exit(1);
}

const entryBundlePath = join(distAssetsDir, entryBundleFile);
const entryBundleBytes = statSync(entryBundlePath).size;

if (entryBundleBytes > maxEntryBundleBytes) {
  console.error(
    `Main entry bundle ${entryBundleFile} is ${formatKiB(entryBundleBytes)}, which exceeds the ${formatKiB(maxEntryBundleBytes)} budget.`,
  );
  process.exit(1);
}

console.log(
  `Main entry bundle ${entryBundleFile} is ${formatKiB(entryBundleBytes)} and within the ${formatKiB(maxEntryBundleBytes)} budget.`,
);
