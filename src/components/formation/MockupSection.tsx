import Image from "next/image";

export default function MockupSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-center">
          <div className="relative w-full max-w-3xl">
            <Image
              src="/mockup-de-pesentation-van-business-academy-vanzon-explorer"
              alt="Mockup Van Business Academy - Présentation complète de la formation"
              width={1200}
              height={800}
              className="w-full h-auto rounded-lg shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
