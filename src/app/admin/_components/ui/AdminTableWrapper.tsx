interface AdminTableWrapperProps {
  children: React.ReactNode;
}

export default function AdminTableWrapper({ children }: AdminTableWrapperProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      {children}
    </div>
  );
}
