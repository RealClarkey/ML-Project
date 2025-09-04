import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import S3BucketFiles from "@/components/ui/S3BucketFiles.jsx"
import DropzoneTile from "@/components/ui/dropzone.jsx"
import React from "react";

export default function Page() {

  const [items, setItems] = React.useState([])

  const handleAnalyse = (item) => { /* start preprocessing */ }
  const handleDownload = (item) => { /* download from S3 */ }
  const handleDelete = (item) => { /* delete from S3 */ }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
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
            {/* Row 1: full width */}
            <div className="h-40 md:col-span-3 rounded-xl border bg-card p-4 flex flex-col">
              <div className="flex-1">
                <DropzoneTile />
              </div>
              <ul className="mt-3 max-h-16 overflow-auto text-sm">
                {/* your upload statuses (you already render these) */}
              </ul>
            </div>

            {/* Row 2: full width */}
            <div className="md:col-span-3 rounded-xl border bg-card p-4">
              <S3BucketFiles />
            </div>

            {/* Row 3: three equal tiles */}
            <div className="h-40 rounded-xl bg-muted/50" />
            <div className="h-40 rounded-xl bg-muted/50" />
            <div className="h-40 rounded-xl bg-muted/50" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
