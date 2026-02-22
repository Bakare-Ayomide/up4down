import { useIsMobile } from "@/hooks/use-mobile";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export const Layout = ({ children, hideSidebar = false }: LayoutProps) => {
  const isMobile = useIsMobile();

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
};
