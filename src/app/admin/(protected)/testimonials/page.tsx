import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import TestimonialFeaturedToggle from "./_components/TestimonialFeaturedToggle";
import { AdminPageHeader } from "@/app/admin/_components/ui";

const allTestimonialsQuery = groq`
  *[_type == "testimonial"] | order(_createdAt desc) {
    _id,
    name,
    role,
    content,
    rating,
    featured,
    "photo": photo.asset->url,
    _createdAt
  }
`;

type Testimonial = {
  _id: string;
  name: string;
  role?: string;
  content: string;
  rating: number;
  featured: boolean;
  photo?: string;
  _createdAt: string;
};

export default async function AdminTestimonialsPage() {
  const testimonials = await adminReadClient.fetch<Testimonial[]>(allTestimonialsQuery);
  const featured = testimonials?.filter((t) => t.featured) ?? [];
  const total = testimonials?.length ?? 0;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Temoignages"
        subtitle={`${total} temoignage${total > 1 ? "s" : ""} · ${featured.length} mis en avant`}
        action={
          <a
            href="/studio/structure/testimonial;new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)", boxShadow: "0 4px 14px rgba(14,165,233,0.35)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un temoignage
          </a>
        }
      />

      {/* Grid */}
      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p className="text-slate-400 text-sm">Aucun temoignage dans Sanity.</p>
          <a
            href="/studio/structure/testimonial;new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm font-semibold text-blue-500 hover:underline"
          >
            Ajouter depuis Sanity Studio
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t._id}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                t.featured ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-100"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {t.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${t.photo}?w=64&h=64&fit=crop&auto=format`}
                      alt={t.name}
                      className="w-9 h-9 rounded-full object-cover bg-slate-100"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role ?? "Client"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <TestimonialFeaturedToggle id={t._id} featured={t.featured} />
                  <a
                    href={`/studio/structure/testimonial;${t._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all"
                    title="Modifier dans Sanity Studio"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${i < t.rating ? "text-amber-400" : "text-slate-200"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">&ldquo;{t.content}&rdquo;</p>

              {/* Featured badge */}
              {t.featured && (
                <div className="mt-3 pt-3 border-t border-amber-100">
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    Mis en avant sur le site
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
