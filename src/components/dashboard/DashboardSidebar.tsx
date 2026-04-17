import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Crown,
  BadgeCheck,
  UsersRound,
  Rocket,
  HandshakeIcon,
  Link2,
  Layers,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import storvoLogo from "@/assets/storvo-logo.png";
import { useState } from "react";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import {
  type TeamRole,
  ROLE_LABELS,
  ROLE_COLORS,
  hasPermission,
} from "@/lib/teamPermissions";

const ALL_MENU_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: null },
  { title: "Products", url: "/dashboard/products", icon: Package, permission: "products.view" as const },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart, permission: "orders.view" as const },
  { title: "Customers", url: "/dashboard/customers", icon: Users, permission: "customers.view" as const },
  { title: "Collections", url: "/dashboard/collections", icon: Layers, permission: "products.view" as const },
  { title: "Links", url: "/dashboard/links", icon: Link2, permission: null },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, permission: "analytics.view" as const },
  { title: "Offers", url: "/dashboard/offers", icon: HandshakeIcon, permission: "orders.view" as const },
  { title: "Growth Tools", url: "/dashboard/growth", icon: Rocket, permission: null, ownerOnly: true },
  { title: "Verification", url: "/dashboard/verification", icon: BadgeCheck, permission: null, ownerOnly: true },
  { title: "Team Members", url: "/dashboard/team", icon: UsersRound, permission: "team.manage" as const },
  { title: "Store Settings", url: "/dashboard/settings", icon: Settings, permission: "store.settings" as const },
];

interface DashboardSidebarProps {
  store: any;
  role?: TeamRole;
}

const DashboardSidebar = ({ store, role = "owner" }: DashboardSidebarProps) => {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { isPro } = useSubscription(store?.id || null);

  const menuItems = ALL_MENU_ITEMS.filter((item) => {
    if (item.ownerOnly && role !== "owner") return false;
    if (item.permission === null) return true;
    return hasPermission(role, item.permission);
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-4 w-full">
            {!collapsed && (
              <div className="flex items-center">
                <img src={storvoLogo} alt="Storvo" className="h-10 w-auto shrink-0 rounded-md border border-border/60 bg-card/80 p-1 shadow-sm" />
              </div>
            )}
            {collapsed && (
              <div className="mx-auto h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <Store className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </button>

          {!collapsed && store && (
            <div className="mx-4 mb-2 rounded-xl bg-accent p-3">
              <p className="text-xs font-medium text-muted-foreground">Your store</p>
              <p className="text-sm font-semibold text-foreground truncate">{store.name}</p>
              <p className="text-xs text-storvo-indigo">{store.slug}.storvo.co</p>
              {role !== "owner" && (
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs ${ROLE_COLORS[role]}`}
                >
                  {ROLE_LABELS[role]}
                </Badge>
              )}
            </div>
          )}

          {!isPro && !collapsed && role === "owner" && (
            <div className="mx-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowUpgrade(true)}
              >
                <Crown className="mr-2 h-3.5 w-3.5" /> Upgrade to Pro
              </Button>
            </div>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="hover:bg-accent/50"
                        activeClassName="bg-accent text-storvo-indigo font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed && <span>Sign Out</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} storeId={store?.id || null} />
    </>
  );
};

export default DashboardSidebar;
