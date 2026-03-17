import Image from "next/image";

const LAPTOP = {
  src: "https://cdn.sanity.io/images/lewexa74/production/bfdc57ebcc01953c6b6cbee01e527f7062c786e9-1998x1392.png",
  alt: "Interface Van Business Academy",
  width: 1998,
  height: 1392,
};

const FLOATS = [
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d3f70a292bbf7b03e5e2dfe71ec413920e087f1f-1459x850.png",
    alt: "Module formation van",
    width: 1459,
    height: 850,
    rotate: "-2deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/5473f111cdb3199e8192ebd19c7c721c5b0ec77d-1459x784.png",
    alt: "Programme formation van",
    width: 1459,
    height: 784,
    rotate: "2deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d9c4c7fe7931c1be66649b8520bbefe4acda6091-1284x850.png",
    alt: "Ressources formation van",
    width: 1284,
    height: 850,
    rotate: "1.5deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/2f1f2a6a93df20af09a71176b79f82316d856447-1317x746.png",
    alt: "Outils formation van",
    width: 1317,
    height: 746,
    rotate: "-1.5deg",
  },
];

export default function FormationScrollReveal() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 pb-16 pt-4">
      {/* Desktop */}
      <div className="hidden md:block relative">
        {/* Laptop central */}
        <div
          className="relative z-10 w-[52%] mx-auto"
          style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.16))" }}
        >
          <Image
            src={LAPTOP.src}
            alt={LAPTOP.alt}
            width={LAPTOP.width}
            height={LAPTOP.height}
            className="w-full h-auto rounded-xl"
            priority
            unoptimized
          />
        </div>

        {/* Screenshots flottants */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Haut gauche */}
          <div
            className="absolute w-[38%] top-0 left-0"
            style={{
              transform: `rotate(${FLOATS[0].rotate}) translateY(-12px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image
              src={FLOATS[0].src}
              alt={FLOATS[0].alt}
              width={FLOATS[0].width}
              height={FLOATS[0].height}
              className="w-full h-auto rounded-xl"
              unoptimized
            />
          </div>

          {/* Haut droite */}
          <div
            className="absolute w-[38%] top-0 right-0"
            style={{
              transform: `rotate(${FLOATS[1].rotate}) translateY(-8px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image
              src={FLOATS[1].src}
              alt={FLOATS[1].alt}
              width={FLOATS[1].width}
              height={FLOATS[1].height}
              className="w-full h-auto rounded-xl"
              unoptimized
            />
          </div>

          {/* Bas gauche */}
          <div
            className="absolute w-[38%] bottom-0 left-0"
            style={{
              transform: `rotate(${FLOATS[2].rotate}) translateY(12px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image
              src={FLOATS[2].src}
              alt={FLOATS[2].alt}
              width={FLOATS[2].width}
              height={FLOATS[2].height}
              className="w-full h-auto rounded-xl"
              unoptimized
            />
          </div>

          {/* Bas droite */}
          <div
            className="absolute w-[38%] bottom-0 right-0"
            style={{
              transform: `rotate(${FLOATS[3].rotate}) translateY(8px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image
              src={FLOATS[3].src}
              alt={FLOATS[3].alt}
              width={FLOATS[3].width}
              height={FLOATS[3].height}
              className="w-full h-auto rounded-xl"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Mobile : carousel horizontal */}
      <div className="md:hidden">
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {FLOATS.map((f, i) => (
            <div
              key={i}
              className="flex-none w-[85vw] snap-center rounded-xl overflow-hidden"
              style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.14))" }}
            >
              <Image
                src={f.src}
                alt={f.alt}
                width={f.width}
                height={f.height}
                className="w-full h-auto"
                priority={i === 0}
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {FLOATS.map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 0 ? "20px" : "6px",
                height: "6px",
                background: i === 0 ? "#B9945F" : "rgba(185,148,95,0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
