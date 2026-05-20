import * as React from "react"
import { useAuth } from "react-oidc-context"
import api from "@/api"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import S3BucketFiles from "@/components/ui/S3BucketFiles"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export default function PreprocessingLayout() {
  const auth = useAuth()
  const authHeader = auth.user?.access_token
    ? { Authorization: `Bearer ${auth.user.access_token}` }
    : {}

  // selection & options
  const [selected, setSelected] = React.useState([])
  const [strategy, setStrategy] = React.useState("basic")
  const [dropAllNaN, setDropAllNaN] = React.useState(true)

  // ui state
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [result, setResult] = React.useState(null) // { new_key, downloadUrl, rows, cols, ... }

  const handleSave = async () => {
    setError("")
    setMessage("")
    setResult(null)

    if (!selected.length) {
      setError("Please select a dataset to preprocess.")
      return
    }

    const dataset_id = selected[0].id || selected[0].key
    setSaving(true)
    try {
      const res = await api.post(
        "/preprocess_and_save",
        {
          dataset_id,
          strategy,
          options: { drop_all_nan: dropAllNaN },
        },
        { headers: authHeader }
      )
      setResult(res.data)
      setMessage("Preprocessed dataset saved.")
      // refresh S3 list so new file appears in tables everywhere
      window.dispatchEvent(new Event("s3:refresh"))
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to save preprocessed dataset.")
    } finally {
      setSaving(false)
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
                <BreadcrumbPage>Preprocessing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Choose dataset */}
            <div className="md:col-span-3 rounded-xl border bg-card p-4">
              <h2 className="text-lg font-semibold mb-3">Choose a dataset</h2>
              <S3BucketFiles enableSelection onSelectionChange={setSelected} />
              <div className="mt-3 text-sm text-muted-foreground">
                {selected.length
                  ? <>Selected: <span className="font-medium">{selected[0].name || selected[0].key}</span></>
                  : "No dataset selected"}
              </div>
            </div>

            {/* Options (left) */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <h2 className="text-lg font-semibold">Preprocessing options</h2>

              <div className="space-y-2">
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger id="strategy">
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (impute/drop)</SelectItem>
                    {/* Future strategies can be added here */}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label>Drop columns with all-NaN</Label>
                  <p className="text-xs text-muted-foreground">
                    Remove columns where every value is missing.
                  </p>
                </div>
                <Switch checked={dropAllNaN} onCheckedChange={setDropAllNaN} />
              </div>

              <div className="pt-1">
                <Button onClick={handleSave} disabled={!selected.length || saving}>
                  {saving ? "Saving…" : "Preprocess & Save"}
                </Button>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {message && !error && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
              </div>
            </div>

            {/* Result (right) */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h2 className="text-lg font-semibold">Result</h2>
              {!result && (
                <p className="text-sm text-muted-foreground">
                  Configure options and click <span className="font-medium">Preprocess &amp; Save</span> to create a new dataset.
                </p>
              )}
              {result && (
                <div className="space-y-2 text-sm">
                  {result.message && <p>{result.message}</p>}
                  <div>
                    <span className="text-muted-foreground">New key:</span>{" "}
                    <span className="font-mono">{result.new_key}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground">Rows:</span>{" "}
                      <span className="font-medium">{result.rows}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cols:</span>{" "}
                      <span className="font-medium">{result.cols}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      onClick={() => result.downloadUrl && window.open(result.downloadUrl, "_blank")}
                      disabled={!result.downloadUrl}
                    >
                      Open processed file
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Tip card (full width, optional) */}
            <div className="md:col-span-3 rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Processed files are saved under <code className="font-mono">/processed/</code> in your S3 bucket
                and will appear in tables automatically. You can download them or use them in downstream steps
                (e.g. ML Models) later.
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
