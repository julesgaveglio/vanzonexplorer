interface AdminFilterBarProps {
  children: React.ReactNode;
}

export default function AdminFilterBar({ children }: AdminFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {children}
    </div>
  );
}
