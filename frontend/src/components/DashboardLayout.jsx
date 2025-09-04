import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import DropzoneTile from "@/components/ui/dropzone"
import S3BucketFiles from "@/components/ui/S3BucketFiles"

export default function DashboardLayout() {
  const [items, setItems] = React.useState([])

  const handleAnalyse = (item) => { /* call backend */ }
  const handleDownload = (item) => { /* download */ }
  const handleDelete = (item) => { /* delete */ }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Member Homepage</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Upload tile */}
            <div className="h-40 md:col-span-3 rounded-xl border bg-card p-4 flex flex-col">
              <div className="flex-1">
                <DropzoneTile />
              </div>
              <ul className="mt-3 max-h-16 overflow-auto text-sm">
                {/* upload statuses */}
              </ul>
            </div>

            {/* Files table */}
            <div className="md:col-span-3 rounded-xl border bg-card p-4">
              <S3BucketFiles
                items={items}
                onAnalyse={handleAnalyse}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onItemsChange={setItems}
              />
            </div>

            {/* Extra tiles */}
            <div className="h-40 rounded-xl bg-muted/50" />
            <div className="h-40 rounded-xl bg-muted/50" />
            <div className="h-40 rounded-xl bg-muted/50" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
