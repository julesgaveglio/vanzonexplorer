import { Composition } from "remotion";
import { AmbianceReel } from "./AmbianceReel";

export const VanzonReel: React.FC = () => {
  return (
    <>
      <Composition
        id="AmbianceReel"
        component={AmbianceReel}
        durationInFrames={30 * 25} // ~25 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
