import {Composition} from "remotion";
import storyboard from "./storyboard.generated.json";
import {SignalCutPreview, type Storyboard} from "./SignalCutPreview";

const FPS = 30;

export const RemotionRoot = () => (
  <Composition
    id="ThreadloomSignalCut"
    component={SignalCutPreview}
    durationInFrames={Math.round((storyboard.total_duration_ms / 1000) * FPS)}
    fps={FPS}
    width={1920}
    height={1080}
    defaultProps={{storyboard: storyboard as Storyboard}}
  />
);
