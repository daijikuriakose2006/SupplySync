import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { alertsApi } from "@/lib/api";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Get user's name initial from localStorage
  const userName = localStorage.getItem("userName") || "";
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  // Fetch real unread alert count
  const fetchAlertCount = async () => {
    try {
      const res = await alertsApi.list();
      setUnreadCount(res.data.length);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/alerts")}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
              <div
                className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold cursor-pointer"
                onClick={() => navigate("/settings")}
                title={userName}
              >
                {initial}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
