import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";

const Dashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { store, role, loading } = useStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/60 bg-card px-4">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => navigate("/")}
                title="Back to Home"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-display text-lg font-semibold text-foreground">Dashboard</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </header>
          <main className="flex-1 p-6 bg-background">
            <DashboardOverview store={store} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
