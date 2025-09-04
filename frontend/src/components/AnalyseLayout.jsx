import React from "react"
import { useAuth } from "react-oidc-context"
import api from "@/api"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import S3BucketFiles from "@/components/ui/S3BucketFiles"
import { Button } from "@/components/ui/button"

export default function AnalyseLayout() {
  const auth = useAuth()
  const authHeader = auth.user?.access_token
    ? { Authorization: `Bearer ${auth.user.access_token}` }
    : {}

  const [selected, setSelected] = React.useState([])
  const [summary, setSummary] = React.useState(null)
  const [topRows, setTopRows] = React.useState([])
  const [error, setError] = React.useState(null)
  const [isAnalysing, setIsAnalysing] = React.useState(false)
  const [isLoadingRows, setIsLoadingRows] = React.useState(false)

  const handleAnalyseSelected = async () => {
    setError(null)
    setSummary(null)
    setIsAnalysing(true)
    try {
      if (selected.length === 0) throw new Error("Select at least one dataset")
      const ds = selected[0]
      const dataset_id = ds.id || ds.key
      const res = await api.post("/begin_preprocessing", { dataset_id }, { headers: authHeader })
      setSummary(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Preprocessing failed")
    } finally {
      setIsAnalysing(false)
    }
  }

  const handleShowRows = async () => {
    setError(null)
    setTopRows([])
    setIsLoadingRows(true)
    try {
      if (selected.length === 0) throw new Error("Select at least one dataset")
      const dataset_id = selected[0].id || selected[0].key
      const res = await api.post("/top_rows", { dataset_id }, { headers: authHeader })
      setTopRows(res.data.top_rows || [])
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to load rows")
    } finally {
      setIsLoadingRows(false)
    }
  }

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
                <BreadcrumbPage>Analyse</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Files table + actions (full width) */}
            <div className="md:col-span-3 rounded-xl border bg-card p-4">
              <S3BucketFiles enableSelection onSelectionChange={setSelected} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">{selected.length} selected</div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyseSelected}
                    disabled={selected.length === 0 || isAnalysing}
                  >
                    {isAnalysing ? "Analysing…" : "Analyse selected"}
                  </Button>
                  <Button
                    onClick={handleShowRows}
                    disabled={selected.length === 0 || isLoadingRows}
                  >
                    {isLoadingRows ? "Loading…" : "Show Top 10 Rows"}
                  </Button>
                </div>
              </div>
              {error && <p className="mt-2 text-sm" style={{ color: "#d32f2f" }}>{error}</p>}
            </div>

            {/* --- Insights: two side-by-side cards --- */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Missing Values */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h2 className="text-lg font-semibold">Missing Values</h2>

                {!summary && !isAnalysing && (
                  <p className="text-sm text-muted-foreground">
                    Click <span className="font-medium">Analyse selected</span> to compute missing values.
                  </p>
                )}
                {isAnalysing && (
                  <p className="text-sm text-muted-foreground">Running preprocessing…</p>
                )}

                {summary?.missing_values && (
                  <ul className="list-disc pl-5">
                    {Object.entries(summary.missing_values).map(([col, cnt]) => (
                      <li key={col}>{col}: {cnt}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Data Types */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h2 className="text-lg font-semibold">Data Types</h2>

                {!summary && !isAnalysing && (
                  <p className="text-sm text-muted-foreground">
                    Click <span className="font-medium">Analyse selected</span> to detect column types.
                  </p>
                )}
                {isAnalysing && (
                  <p className="text-sm text-muted-foreground">Running preprocessing…</p>
                )}

                {summary?.column_types && (
                  <ul className="list-disc pl-5">
                    {Object.entries(summary.column_types).map(([col, dtype]) => (
                      <li key={col}>{col}: {dtype}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Card: Top 10 Rows (always visible) */}
            <div className="md:col-span-3 rounded-xl border bg-card p-4 overflow-auto">
              <h2 className="text-lg font-semibold">Top 10 Rows</h2>

              {!topRows.length && !isLoadingRows && (
                <p className="text-sm text-muted-foreground">
                  Click <span className="font-medium">Show Top 10 Rows</span> to preview the first rows of your dataset.
                </p>
              )}

              {isLoadingRows && (
                <p className="text-sm text-muted-foreground">Loading preview…</p>
              )}

              {topRows.length > 0 && (
                <div className="mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {Object.keys(topRows[0]).map((col) => (
                          <th key={col} className="border-b px-2 py-1 text-left font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topRows.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-2 py-1">{val == null ? "—" : String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
