// src/components/ui/S3BucketFiles.jsx
"use client"

import * as React from "react"
import api from "@/api"
import { DataTable, s3Columns } from "@/components/ui/data-table"
import { useAuth } from "react-oidc-context"

export default function S3BucketFiles() {
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

  React.useEffect(() => {
    fetchItems()
  }, [fetchItems])

  React.useEffect(() => {
    const h = () => fetchItems()
    window.addEventListener("s3:refresh", h)
    return () => window.removeEventListener("s3:refresh", h)
  }, [fetchItems])

  const columns = React.useMemo(
    () =>
      s3Columns({
        onDownload: (item) => window.open(item.downloadUrl ?? "#", "_blank"),
        onDelete: async (item) => {
          await api.delete(`/datasets?key=${encodeURIComponent(item.key)}`, {
            headers: { Authorization: `Bearer ${auth.user?.access_token}` },
          })
          fetchItems()
        },
      }),
    [auth.user?.access_token, fetchItems]
  )

  return <DataTable columns={columns} data={items} />
}
