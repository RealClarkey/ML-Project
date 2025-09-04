"use client"

import * as React from "react"
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
} from "@tanstack/react-table"
import {
  ArrowUpDown, MoreHorizontal, Folder, File as FileIcon,
  PlayCircle, Download, Trash2, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// helpers
const fileTypeFromName = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase()
  if (!ext || ext === name.toLowerCase()) return "folder"
  return ext
}
const displayType = (item) => item.type || item.contentType || fileTypeFromName(item.name || item.key || "")
const displayName = (item) => item.name || item.key || "(unnamed)"
const displayUploaded = (item) => {
  const raw = item.uploaded || item.lastModified || item.LastModified
  if (!raw) return ""
  const d = raw instanceof Date ? raw : new Date(raw)
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d)
}

const getUploadedRaw = (item) =>
  item.uploaded ??
  item.uploadedAt ??
  item.uploaded_at ??
  item.lastModified ??
  item.LastModified ??
  item.last_modified ??
  item.createdAt ??
  item.created_at ??
  item.creationDate ??
  item.CreationDate ??
  null

const toDate = (raw) => {
  if (!raw) return null
  if (raw instanceof Date) return raw
  const d1 = new Date(raw)
  if (!Number.isNaN(d1)) return d1
  // try to normalize common "YYYY-MM-DD HH:mm:ss" to ISO
  const normalized = String(raw).replace(" ", "T")
  const d2 = new Date(normalized)
  return !Number.isNaN(d2) ? d2 : null
}

const formatDate = (d) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(d)

// columns factory
export function s3Columns({ onAnalyse, onDownload, onDelete } = {}) {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 36,
    },
    {
      id: "name",
      accessorFn: (row) => displayName(row),
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original
        const type = displayType(item)
        const isFolder = type === "folder" || item.key?.endsWith("/")
        const Icon = isFolder ? Folder : FileIcon
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="truncate">{displayName(item)}</span>
          </div>
        )
      },
    },
    {
      id: "type",
      accessorFn: (row) => displayType(row),
      header: "Type",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs capitalize">
          {row.getValue("type")}
        </span>
      ),
    },
    {
      id: "uploaded",
      accessorFn: (row) => toDate(getUploadedRaw(row)), // <- returns a Date for sorting
      sortingFn: "datetime",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Uploaded <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const d = getValue()
        return d ? <span>{formatDate(d)}</span> : <span className="text-muted-foreground">—</span>
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onDownload?.(item)}>
              <Download className=" h-4 w-4" />
            </Button>

            <Button size="sm" variant="destructive" onClick={() => onDelete?.(item)}>
              <Trash2 className=" h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}

// generic table UI
export function DataTable({ columns, data }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() ?? "")}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter((c) => c.getCanHide()).map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                className="capitalize"
                checked={c.getIsVisible()}
                onCheckedChange={(v) => c.toggleVisibility(!!v)}
              >
                {c.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.columnDef?.meta?.align === "right" ? "text-right" : ""}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef?.meta?.align === "right" ? "text-right" : ""}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  )
}
