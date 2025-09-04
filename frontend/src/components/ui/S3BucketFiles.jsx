// src/components/ui/S3BucketFiles.jsx
"use client"

import * as React from "react"
import api from "@/api"
import { DataTable, s3Columns } from "@/components/ui/data-table"
import { useAuth } from "react-oidc-context"

export default function S3BucketFiles({
  enableSelection = false,
  onSelectionChange,
  onDownload,
  onDelete,
}) {
  const auth = useAuth()
  const [items, setItems] = React.useState([])

  const fetchItems = React.useCallback(() => {
    if (!auth.isAuthenticated) return
    api
      .get("/datasets", {
        headers: auth.user?.access_token
          ? { Authorization: `Bearer ${auth.user.access_token}` }
          : {},
      })
      .then((res) => setItems(res.data))
      .catch(console.error)
  }, [auth.isAuthenticated, auth.user?.access_token])

  React.useEffect(() => { fetchItems() }, [fetchItems])

  React.useEffect(() => {
    const h = () => fetchItems()
    window.addEventListener("s3:refresh", h)
    return () => window.removeEventListener("s3:refresh", h)
  }, [fetchItems])

  const columns = React.useMemo(
    () =>
      s3Columns({
        enableSelection,
        onDownload: (item) => {
          if (onDownload) return onDownload(item)
          const url = item.downloadUrl
          if (!url) return console.warn("No downloadUrl for item", item)
          window.open(url, "_blank")
        },
        onDelete: async (item) => {
          if (onDelete) return onDelete(item)
          try {
            await api.delete(`/datasets?key=${encodeURIComponent(item.key)}`, {
              headers: { Authorization: `Bearer ${auth.user?.access_token}` },
            })
            fetchItems()
          } catch (e) {
            console.error("Delete failed", e)
          }
        },
      }),
    [enableSelection, onDownload, onDelete, auth.user?.access_token, fetchItems]
  )

  return (
    <DataTable
      columns={columns}
      data={items}
      enableSelection={enableSelection}
      onSelectionChange={onSelectionChange}
    />
  )
}
