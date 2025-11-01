import { LayoutDashboard, Users, CreditCard, FileText, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeSection, setActiveSection, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
          data-testid="overlay-sidebar"
        />
      )}
      
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300",
          !isOpen && "-translate-x-full lg:translate-x-0"
        )}
        data-testid="sidebar-admin"
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" data-testid="text-sidebar-title">LMS Admin</h2>
            <p className="text-xs text-muted-foreground">Management Portal</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-primary/10 text-primary font-medium"
                )}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsOpen(false);
                }}
                data-testid={`button-nav-${item.id}`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t">
          <div className="bg-primary/5 rounded-lg p-4">
            <p className="text-sm font-medium mb-1">Need Help?</p>
            <p className="text-xs text-muted-foreground mb-3">
              Check our documentation or contact support
            </p>
            <Button variant="outline" size="sm" className="w-full" data-testid="button-help">
              Get Support
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
