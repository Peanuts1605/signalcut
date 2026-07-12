import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const artifactRoot = path.join(repoRoot, "artifacts", "threadloom");
const videoPath = path.join(artifactRoot, "signalcut_threadloom_outcome_first.mp4");
const storyboard = JSON.parse(
  await readFile(path.join(artifactRoot, "storyboard.json"), "utf8"),
);

const probe = spawnSync(
  "ffprobe",
  [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size:stream=codec_name,width,height,r_frame_rate",
    "-of",
    "json",
    videoPath,
  ],
  {encoding: "utf8"},
);
if (probe.status !== 0) {
  throw new Error(probe.stderr || "ffprobe failed");
}

const metadata = JSON.parse(probe.stdout);
const videoStream = metadata.streams.find((stream) => stream.codec_name === "h264");
const durationSeconds = Number(metadata.format.duration);
const file = await stat(videoPath);
if (!videoStream || videoStream.width !== 1920 || videoStream.height !== 1080) {
  throw new Error("render must be H.264 at 1920x1080");
}
if (videoStream.r_frame_rate !== "30/1") {
  throw new Error("render must be 30 fps");
}
if (Math.abs(durationSeconds - storyboard.total_duration_ms / 1000) > 0.1) {
  throw new Error("render duration does not match the selected storyboard");
}
if (file.size < 1_000_000) {
  throw new Error("render is unexpectedly small");
}

const videoBytes = await readFile(videoPath);
const proof = {
  status: "passed",
  video: path.basename(videoPath),
  video_sha256: createHash("sha256").update(videoBytes).digest("hex"),
  size_bytes: file.size,
  codec: videoStream.codec_name,
  width: videoStream.width,
  height: videoStream.height,
  fps: videoStream.r_frame_rate,
  duration_seconds: durationSeconds,
  storyboard_duration_ms: storyboard.total_duration_ms,
  scene_count: storyboard.scenes.length,
  strategy: storyboard.strategy,
  manifest_hash: storyboard.manifest_hash,
};
await writeFile(path.join(artifactRoot, "render-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(proof)}\n`);
