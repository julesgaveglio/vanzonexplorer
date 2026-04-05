import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles & Guides Vanlife Pays Basque",
  description:
    "Road trips Pays Basque, aménagement van et business van — guides pratiques, conseils techniques et stratégies pour louer ou vivre en van au Pays Basque.",
  openGraph: {
    title: "Articles & Guides Vanlife Pays Basque",
    description:
      "Road trips, aménagement van et business van — tout ce qu'il faut pour explorer, aménager ou rentabiliser son van au Pays Basque.",
    type: "website",
  },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
