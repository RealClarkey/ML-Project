"use client"

import * as React from "react"
import { Plus, LineChart, SlidersHorizontal, BrainCircuit } from "lucide-react"
import { useAuth } from "react-oidc-context"
import { Link, useLocation } from "react-router-dom"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  { label: "Analyse",        to: "/analyse",       icon: LineChart },
  { label: "Preprocessing",  to: "/preprocessing", icon: SlidersHorizontal },
  { label: "ML Models",      to: "/models",        icon: BrainCircuit },
]

export function AppSidebar(props) {
  const auth = useAuth()
  const email  = auth.user?.profile?.email ?? ""
  const name   = auth.user?.profile?.name ?? (email ? email.split("@")[0] : "User")
  const avatar = auth.user?.profile?.picture ?? undefined
  const { pathname } = useLocation()

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={{ name, email, avatar }} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, to, icon: Icon }) => {
                const active = pathname === to
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      asChild
                      className={active ? "bg-sidebar-accent text-sidebar-accent-foreground" : undefined}
                    >
                      <Link to={to}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Plus />
              <span>MLDIY.co.uk</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
