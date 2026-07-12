import {createHash} from "node:crypto";
import {copyFile, mkdir, readFile, writeFile} from "node:fs/promises";
import process from "node:process";
import {fileURLToPath} from "node:url";
import path from "node:path";

const modulePath = fileURLToPath(import.meta.url);
const defaultRenderRoot = path.resolve(path.dirname(modulePath), "..");
const defaultRepoRoot = path.resolve(defaultRenderRoot, "../..");

const sha256File = async (filePath) => {
  const contents = await readFile(filePath);
  return createHash("sha256").update(contents).digest("hex");
};

export const syncProof = async ({
  repoRoot = defaultRepoRoot,
  renderRoot = defaultRenderRoot,
} = {}) => {
  const artifactRoot = path.join(repoRoot, "artifacts", "threadloom");
  const fixtureRoot = path.join(repoRoot, "fixtures", "threadloom");
  const storyboard = JSON.parse(await readFile(path.join(artifactRoot, "storyboard.json"), "utf8"));
  const evidence = JSON.parse(
    await readFile(path.join(artifactRoot, "evidence-manifest.json"), "utf8"),
  );
  const evidenceByPath = new Map(evidence.map((asset) => [asset.local_path, asset]));
  const requestedPaths = [
    ...new Set(storyboard.scenes.flatMap((scene) => scene.source_paths)),
  ];

  await mkdir(path.join(renderRoot, "public", "evidence"), {recursive: true});
  await mkdir(path.join(renderRoot, "src"), {recursive: true});

  for (const relativePath of requestedPaths) {
    const asset = evidenceByPath.get(relativePath);
    if (!asset) {
      throw new Error(`storyboard evidence is missing from manifest: ${relativePath}`);
    }
    const source = path.join(fixtureRoot, relativePath);
    const digest = await sha256File(source);
    if (digest !== asset.sha256) {
      throw new Error(`evidence hash mismatch: ${relativePath}`);
    }
    const destination = path.join(renderRoot, "public", relativePath);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(source, destination);
  }

  await writeFile(
    path.join(renderRoot, "src", "storyboard.generated.json"),
    `${JSON.stringify(storyboard, null, 2)}\n`,
  );
  return {
    assetCount: requestedPaths.length,
    sceneCount: storyboard.scenes.length,
    totalDurationMs: storyboard.total_duration_ms,
    manifestHash: storyboard.manifest_hash,
  };
};

if (path.resolve(process.argv[1] ?? "") === modulePath) {
  const result = await syncProof();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
