import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChartBar, ArrowRightLeft, PiggyBank, Settings, RefreshCw } from "lucide-react";

const menuItems = [
  {
    title: "Oportunidades",
    icon: ChartBar,
    url: "#opportunities",
  },
  {
    title: "Operações",
    icon: ArrowRightLeft,
    url: "#operations",
  },
  {
    title: "Lucros",
    icon: PiggyBank,
    url: "#profits",
  },
  {
    title: "Configurações",
    icon: Settings,
    url: "#settings",
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Polygon Arbitrage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}