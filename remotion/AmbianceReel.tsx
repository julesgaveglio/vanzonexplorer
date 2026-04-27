import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  staticFile,
  Video,
  Easing,
} from "remotion";

const CLIPS = [
  { src: staticFile("reel-clips/IMG_7285.mov"), durationFrames: 5 * 30 },
  { src: staticFile("reel-clips/IMG_7286.mov"), durationFrames: 4 * 30 },
  { src: staticFile("reel-clips/IMG_7287.mov"), durationFrames: 5 * 30 },
  { src: staticFile("reel-clips/IMG_7288.mov"), durationFrames: 4 * 30 },
  { src: staticFile("reel-clips/IMG_7289.mov"), durationFrames: 7 * 30 },
];

const FADE_FRAMES = 12; // frames for crossfade transition

function ClipWithTransition({
  src,
  durationFrames,
}: {
  src: string;
  durationFrames: number;
}) {
  const frame = useCurrentFrame();

  // Fade in
  const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.ease,
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [durationFrames - FADE_FRAMES, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.ease }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // Subtle slow zoom (Ken Burns)
  const scale = interpolate(frame, [0, durationFrames], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <Video
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function TitleOverlay() {
  const frame = useCurrentFrame();

  // Appears at the beginning, fades out after 3 seconds
  const opacity = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.ease,
  });

  const translateY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            letterSpacing: -1,
            lineHeight: 1.15,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Bienvenue
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            letterSpacing: -1,
            lineHeight: 1.15,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          à bord 🚐
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            marginTop: 16,
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          @vanzonexplorer
        </div>
      </div>
    </AbsoluteFill>
  );
}

function EndOverlay() {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.ease,
  });

  const scale = interpolate(frame, [0, 20], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "white",
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Vanzon Explorer
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "rgba(255,255,255,0.8)",
            marginTop: 12,
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Loue ton van au Pays Basque
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const AmbianceReel: React.FC = () => {
  // Calculate sequence starts with overlap for crossfade
  let startFrame = 0;
  const sequences: { src: string; start: number; duration: number }[] = [];

  for (const clip of CLIPS) {
    sequences.push({
      src: clip.src,
      start: startFrame,
      duration: clip.durationFrames,
    });
    startFrame += clip.durationFrames - FADE_FRAMES; // overlap for crossfade
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Video clips with crossfade transitions */}
      {sequences.map((seq, i) => (
        <Sequence key={i} from={seq.start} durationInFrames={seq.duration}>
          <ClipWithTransition src={seq.src} durationFrames={seq.duration} />
        </Sequence>
      ))}

      {/* Title overlay — first 3 seconds */}
      <Sequence from={0} durationInFrames={90}>
        <TitleOverlay />
      </Sequence>

      {/* End overlay — last 4 seconds */}
      <Sequence from={startFrame - 90} durationInFrames={120}>
        <EndOverlay />
      </Sequence>

      {/* Subtle dark gradient at top and bottom for text readability */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 300,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 300,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
