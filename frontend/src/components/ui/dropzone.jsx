// src/components/ui/dropzone.jsx
"use client"

import { useMemo, useState } from "react"
import { useAuth } from "react-oidc-context"
import api from "@/api"
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone"

export default function DropzoneTile() {
  const auth = useAuth()
  const [queue, setQueue] = useState([]) // [{file, status, error?}]

  const headers = useMemo(
    () =>
      auth.user?.access_token
        ? { Authorization: `Bearer ${auth.user.access_token}` }
        : {},
    [auth.user?.access_token]
  )

  const handleDrop = async (files) => {
    const items = files.map((file) => ({ file, status: "queued" }))
    setQueue((q) => [...items, ...q])

    for (const it of items) {
      setQueue((q) => q.map((x) => (x === it ? { ...x, status: "uploading" } : x)))

      try {
        const form = new FormData()
        form.append("file", it.file) // backend expects 'file' (see CSVUploadForm.jsx)

        await api.post("/upload_csv", form, {
          headers: {
            ...headers,
            // axios will set correct multipart boundary automatically
          },
        })

        setQueue((q) => q.map((x) => (x === it ? { ...x, status: "done" } : x)))

        // tell the table to refetch
        window.dispatchEvent(new CustomEvent("s3:refresh"))
      } catch (err) {
        console.error(err)
        setQueue((q) =>
          q.map((x) =>
            x === it ? { ...x, status: "error", error: String(err) } : x
          )
        )
      }
    }
  }

  return (
    <div className="w-full h-full">
      <Dropzone
        className="w-full h-full p-4 border border-dashed rounded-xl flex items-center justify-center"
        accept={{ ".csv files": [".csv"] }}
        maxFiles={10}
        maxSize={50 * 1024 * 1024}
        onDrop={handleDrop}
        onError={(err) => console.error(err)}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>

      {/* tiny status (optional) */}
      {queue.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {queue.map((q, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="truncate">{q.file.name}</span>
              <span
                className={
                  q.status === "done"
                    ? "text-green-600"
                    : q.status === "error"
                    ? "text-red-600"
                    : "text-muted-foreground"
                }
              >
                {q.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}