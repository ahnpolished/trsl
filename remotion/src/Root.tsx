import { Composition } from "remotion";
import { GachaReveal } from "./GachaReveal";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GachaReveal"
        component={GachaReveal}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
