import assert from "node:assert/strict";
import {mkdtemp, readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {syncProof} from "./sync-proof.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

test("syncProof copies only verified storyboard evidence", async () => {
  const renderRoot = await mkdtemp(path.join(tmpdir(), "signalcut-render-"));
  const result = await syncProof({repoRoot, renderRoot});
  const generated = JSON.parse(
    await readFile(path.join(renderRoot, "src", "storyboard.generated.json"), "utf8"),
  );

  assert.equal(result.assetCount, 7);
  assert.equal(result.sceneCount, 6);
  assert.equal(result.totalDurationMs, 55_000);
  assert.equal(result.manifestHash, generated.manifest_hash);
  assert.equal(generated.strategy, "outcome_first");
});
