interface AdminKPIGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 6;
}

const colsMap: Record<2 | 3 | 4 | 6, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

export default function AdminKPIGrid({ children, cols = 4 }: AdminKPIGridProps) {
  return (
    <div className={`grid gap-3 md:gap-4 ${colsMap[cols]}`}>
      {children}
    </div>
  );
}
