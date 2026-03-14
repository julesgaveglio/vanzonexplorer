interface FAQItem {
  question: string;
  answer: string;
}

export default function ArticleFAQ({ faqItems }: { faqItems: FAQItem[] }) {
  if (faqItems.length === 0) return null;

  return (
    <section className="py-12">
      <h2 className="text-2xl font-black text-slate-900 mb-8">Questions fréquentes</h2>
      <div className="space-y-3">
        {faqItems.map((faq, i) => (
          <details key={i} className="glass-card !p-0 overflow-hidden group">
            <summary className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors cursor-pointer list-none">
              <span className="font-semibold text-slate-900 text-sm md:text-base">
                {faq.question}
              </span>
              <span className="text-slate-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="px-5 pb-5 pt-1">
              <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
