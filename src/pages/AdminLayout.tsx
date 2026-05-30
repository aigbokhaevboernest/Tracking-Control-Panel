import { useState } from "react";
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
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/shipments", label: "Shipments", icon: Package },
  { to: "/admin/update", label: "Update Shipment", icon: Edit3 },
  { to: "/admin/delete", label: "Delete Shipment", icon: Trash2 },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/hold-settings", label: "Hold Settings", icon: Settings },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-white shadow-sm transition-all duration-300 ease-in-out print:hidden",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex items-center gap-3 border-b px-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-xs text-muted-foreground">Logged in as</div>
              <div className="font-semibold tracking-wider">ADMIN</div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-2">
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
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-2">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-all duration-300",
          collapsed ? "ml-16" : "ml-64",
        )}
      >
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm print:hidden">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Shipment Admin</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
