import Image from "next/image";
import Link from "next/link";

export default function TunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white">
      {/* Logo discret */}
      <div className="flex justify-center pt-6 pb-2">
        <Link href="/formation" aria-label="Vanzon Explorer">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/6fb25c3abe3260a98f42e58b3268810a26fbfed3-542x117.png"
            alt="Vanzon Explorer"
            width={140}
            height={30}
            unoptimized
            className="opacity-80 hover:opacity-100 transition-opacity"
          />
        </Link>
      </div>
      {children}
    </main>
  );
}
