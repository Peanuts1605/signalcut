import "./index.css";
import type {CSSProperties} from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

type Purpose = "pain" | "promise" | "workflow" | "proof" | "outcome" | "cta";

type StoryboardScene = {
  purpose: Purpose;
  source_asset_ids: string[];
  source_paths: string[];
  headline: string;
  duration_ms: number;
};

export type Storyboard = {
  project_name: string;
  strategy: string;
  manifest_hash: string;
  total_duration_ms: number;
  scenes: StoryboardScene[];
};

export type SignalCutPreviewProps = {
  storyboard: Storyboard;
};

const COLORS = {
  ink: "#172426",
  muted: "#56666A",
  paper: "#F1F0EA",
  paperLight: "#FAFAF7",
  line: "#9EAAA6",
  coral: "#D4614E",
  teal: "#247F79",
  mustard: "#C79B2A",
  indigo: "#405783",
};

const PURPOSE_COLOR: Record<Purpose, string> = {
  pain: COLORS.coral,
  promise: COLORS.indigo,
  workflow: COLORS.mustard,
  proof: COLORS.teal,
  outcome: COLORS.teal,
  cta: COLORS.coral,
};

const SUPPORTING_COPY: Record<Purpose, string> = {
  outcome: "One board. Every player leaves a trace.",
  pain: "Every placement changes the same cloth for everyone.",
  promise: "The whole subreddit opens the same daily board.",
  workflow: "Choose. Rotate. Place. Connect.",
  proof: "Accepted in one view. Present in the next.",
  cta: "The next stitch belongs to the community.",
};

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};

const FrameBackground = ({accent}: {accent: string}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.paper,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(23,36,38,0.025) 0, rgba(23,36,38,0.025) 1px, transparent 1px, transparent 16px)",
        backgroundPosition: `0 ${interpolate(frame, [0, 275], [0, 16], clamp)}px`,
      }}
    >
      <div style={{height: 10, backgroundColor: accent}} />
    </AbsoluteFill>
  );
};

const EvidenceImage = ({
  path,
  style,
  imageStyle,
}: {
  path: string;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        overflow: "hidden",
        border: `3px solid ${COLORS.ink}`,
        borderRadius: 6,
        backgroundColor: COLORS.paperLight,
        boxShadow: "14px 14px 0 rgba(23,36,38,0.13)",
        ...style,
      }}
    >
      <Img
        src={staticFile(path)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, 275], [1.015, 1.055], clamp),
          ...imageStyle,
        }}
      />
    </div>
  );
};

const SceneHeader = ({scene, index}: {scene: StoryboardScene; index: number}) => (
  <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
    <div style={{display: "flex", alignItems: "baseline", gap: 18}}>
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 38,
          fontWeight: 700,
        }}
      >
        Threadloom
      </div>
      <div style={{fontSize: 24, color: COLORS.muted}}>a shared daily game on Reddit</div>
    </div>
    <div
      style={{
        color: PURPOSE_COLOR[scene.purpose],
        fontSize: 26,
        fontWeight: 800,
        textTransform: "uppercase",
      }}
    >
      {String(index + 1).padStart(2, "0")} / 06 · {scene.purpose}
    </div>
  </div>
);

const ProofFooter = ({scene, storyboard}: {scene: StoryboardScene; storyboard: Storyboard}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: `2px solid ${COLORS.line}`,
      paddingTop: 16,
      fontSize: 22,
      color: COLORS.muted,
    }}
  >
    <span>Real product evidence · {scene.source_paths.map((item) => item.split("/").at(-1)).join(" + ")}</span>
    <span>SignalCut · {storyboard.strategy} · {storyboard.manifest_hash.slice(0, 8)}</span>
  </div>
);

const PortraitScene = ({scene}: {scene: StoryboardScene}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1fr 760px",
        gap: 80,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          opacity: interpolate(frame, [8, 34], [0, 1], {...clamp, easing: EASE}),
          translate: `${interpolate(frame, [8, 40], [-42, 0], {...clamp, easing: EASE})}px 0`,
        }}
      >
        <div
          style={{
            color: PURPOSE_COLOR[scene.purpose],
            fontSize: 28,
            fontWeight: 850,
            textTransform: "uppercase",
          }}
        >
          {scene.purpose === "outcome" ? "The result, first" : "The shared tension"}
        </div>
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 98,
            lineHeight: 0.98,
            fontWeight: 700,
            maxWidth: 920,
          }}
        >
          {scene.headline}
        </div>
        <div style={{fontSize: 42, lineHeight: 1.25, color: COLORS.muted, maxWidth: 840}}>
          {SUPPORTING_COPY[scene.purpose]}
        </div>
      </div>
      <EvidenceImage
        path={scene.source_paths[0]}
        style={{width: 650, height: 730, justifySelf: "center"}}
        imageStyle={{objectFit: "contain", backgroundColor: COLORS.paperLight}}
      />
    </div>
  );
};

const LandscapeScene = ({scene}: {scene: StoryboardScene}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 26}}>
      <div style={{display: "flex", alignItems: "end", justifyContent: "space-between", gap: 48}}>
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 76,
            lineHeight: 1,
            fontWeight: 700,
            maxWidth: 1220,
            opacity: interpolate(frame, [8, 34], [0, 1], {...clamp, easing: EASE}),
            translate: `0 ${interpolate(frame, [8, 40], [30, 0], {...clamp, easing: EASE})}px`,
          }}
        >
          {scene.headline}
        </div>
        <div
          style={{
            fontSize: 32,
            lineHeight: 1.25,
            color: COLORS.muted,
            maxWidth: 500,
            textAlign: "right",
          }}
        >
          {SUPPORTING_COPY[scene.purpose]}
        </div>
      </div>
      <EvidenceImage path={scene.source_paths[0]} style={{flex: 1, minHeight: 0}} />
    </div>
  );
};

const ProofScene = ({scene}: {scene: StoryboardScene}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 24}}>
      <div style={{display: "flex", alignItems: "end", justifyContent: "space-between", gap: 46}}>
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 76,
            lineHeight: 1,
            fontWeight: 700,
            maxWidth: 1120,
          }}
        >
          {scene.headline}
        </div>
        <div style={{fontSize: 32, color: COLORS.teal, fontWeight: 800}}>
          {SUPPORTING_COPY.proof}
        </div>
      </div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34, flex: 1, minHeight: 0}}>
        {scene.source_paths.map((source, index) => (
          <EvidenceImage
            key={source}
            path={source}
            style={{
              minHeight: 0,
              opacity: interpolate(frame, [12 + index * 18, 40 + index * 18], [0, 1], {
                ...clamp,
                easing: EASE,
              }),
              translate: `${index === 0 ? -24 : 24}px 0`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const CallToActionScene = ({scene}: {scene: StoryboardScene}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [24, 64], [0, 1], {...clamp, easing: EASE});
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        gap: 72,
        alignItems: "center",
      }}
    >
      <EvidenceImage path={scene.source_paths[0]} style={{height: 690}} />
      <div style={{display: "flex", flexDirection: "column", gap: 30, opacity: reveal}}>
        <div style={{fontSize: 28, color: COLORS.coral, fontWeight: 850, textTransform: "uppercase"}}>
          The loom is open
        </div>
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 96,
            lineHeight: 0.98,
            fontWeight: 700,
          }}
        >
          {scene.headline}
        </div>
        <div style={{fontSize: 40, lineHeight: 1.25, color: COLORS.muted}}>
          {SUPPORTING_COPY.cta}
        </div>
        <div style={{display: "flex", height: 10, width: `${reveal * 100}%`, marginTop: 18}}>
          <div style={{flex: 1, backgroundColor: COLORS.coral}} />
          <div style={{flex: 1, backgroundColor: COLORS.teal}} />
          <div style={{flex: 1, backgroundColor: COLORS.mustard}} />
        </div>
      </div>
    </div>
  );
};

const StoryScene = ({
  scene,
  index,
  storyboard,
  durationInFrames,
}: {
  scene: StoryboardScene;
  index: number;
  storyboard: Storyboard;
  durationInFrames: number;
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    {...clamp, easing: EASE},
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
        color: COLORS.ink,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <FrameBackground accent={PURPOSE_COLOR[scene.purpose]} />
      <AbsoluteFill
        style={{
          padding: "58px 92px 42px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <SceneHeader scene={scene} index={index} />
        {scene.purpose === "proof" ? (
          <ProofScene scene={scene} />
        ) : scene.purpose === "outcome" || scene.purpose === "pain" ? (
          <PortraitScene scene={scene} />
        ) : scene.purpose === "cta" ? (
          <CallToActionScene scene={scene} />
        ) : (
          <LandscapeScene scene={scene} />
        )}
        <ProofFooter scene={scene} storyboard={storyboard} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SignalCutPreview = ({storyboard}: SignalCutPreviewProps) => {
  let from = 0;
  return (
    <AbsoluteFill>
      {storyboard.scenes.map((scene, index) => {
        const durationInFrames = Math.round((scene.duration_ms / 1000) * 30);
        const start = from;
        from += durationInFrames;
        return (
          <Sequence key={`${scene.purpose}-${index}`} from={start} durationInFrames={durationInFrames}>
            <StoryScene
              scene={scene}
              index={index}
              storyboard={storyboard}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
