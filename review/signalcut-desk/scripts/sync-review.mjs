import {copyFile, mkdir, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const reviewRoot = path.resolve(here, "..");
const repoRoot = path.resolve(reviewRoot, "../..");
const artifactRoot = path.join(repoRoot, "artifacts", "threadloom");
const destination = path.join(reviewRoot, "public", "proof");
await mkdir(path.join(destination, "evidence"), {recursive: true});

for (const name of [
  "storyboard.json",
  "story-candidates.json",
  "evidence-manifest.json",
  "selection-receipt.json",
  "render-proof.json",
  "signalcut_threadloom_outcome_first.mp4",
]) {
  await copyFile(path.join(artifactRoot, name), path.join(destination, name));
}
await copyFile(
  path.join(artifactRoot, "proof-stills", "scene-01.jpg"),
  path.join(destination, "preview-poster.jpg"),
);

const evidence = JSON.parse(await readFile(path.join(artifactRoot, "evidence-manifest.json")));
for (const asset of evidence) {
  await copyFile(
    path.join(repoRoot, "fixtures", "threadloom", asset.local_path),
    path.join(destination, asset.local_path),
  );
}
process.stdout.write(`synced ${evidence.length} evidence assets\n`);
