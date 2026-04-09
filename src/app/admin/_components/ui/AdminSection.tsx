interface AdminSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function AdminSection({ title, children, className = '', noPadding = false }: AdminSectionProps) {
  return (
    <div className={`bg-white rounded-xl md:rounded-2xl border border-slate-100 ${noPadding ? '' : 'p-4 md:p-6'} ${className}`}>
      {title && (
        <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}
