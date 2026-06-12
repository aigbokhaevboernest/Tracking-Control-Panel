import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Edit3,
  Trash2,
  FileText,
  Settings,
  LogOut,
  Menu,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/shipments", label: "Shipments", icon: Package },
  { to: "/admin/update", label: "Update Shipment", icon: Edit3 },
  { to: "/admin/delete", label: "Delete Shipment", icon: Trash2 },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/custom-message", label: "Custom Message", icon: Mail },
  { to: "/admin/AppConfigurationPage", label: " App Configuration", icon: Settings },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  useInactivityLogout();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-white shadow-sm transition-transform duration-300 ease-in-out print:hidden",
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          desktopCollapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <div className={cn("p-4 overflow-hidden", desktopCollapsed && "lg:hidden")}>
          <div className="text-xs text-muted-foreground">Logged in as</div>
          <div className="font-semibold tracking-wider">ADMIN</div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {nav.map((item) => {
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-600 hover:bg-slate-100",
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn("truncate", desktopCollapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className={cn(desktopCollapsed && "lg:hidden")}>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          desktopCollapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-white px-3 py-2 shadow-sm print:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setDesktopCollapsed((c) => !c);
              } else {
                setMobileOpen((o) => !o);
              }
            }}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
