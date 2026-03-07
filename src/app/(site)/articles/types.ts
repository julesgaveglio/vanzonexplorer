export type SanityArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "Road Trips" | "Aménagement Van" | "Business Van" | "Achat Van";
  tag?: string;
  readTime?: string;
  publishedAt: string;
  featured: boolean;
  coverImage?: { url: string; alt?: string; credit?: string } | null;
};
