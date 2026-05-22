'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search, Filter, MoreHorizontal, Eye, Edit, Trash2, RefreshCw, FileText,
  CheckCircle2, Clock, Loader2, Pencil, Plus, Download, XCircle, Coins,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  useArticles, useArticleStats, useDeleteArticle, useBulkDeleteArticles,
  useBulkUpdateStatus, useSyncScheduled, type ArticleListItem,
} from '@/hooks/use-articles'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'GENERATING', label: 'Generating' },
  { value: 'FAILED', label: 'Failed' },
]

const statusBadge = (status: string) => {
  switch (status) {
    case 'PUBLISHED': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'DRAFT': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'SCHEDULED': case 'FUTURE': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'GENERATING': case 'READY': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'FAILED': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export default function ArticlesPage() {
  const confirm = useConfirm()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const { data, isLoading, refetch } = useArticles({ search: debouncedSearch, status: statusFilter, page, limit: 20 })
  const { data: stats } = useArticleStats()
  const deleteArticle = useDeleteArticle()
  const bulkDelete = useBulkDeleteArticles()
  const bulkStatus = useBulkUpdateStatus()
  const syncScheduled = useSyncScheduled()

  const articles = data?.data || []
  const meta = data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 }
  const isBusy = isLoading || deleteArticle.isPending || bulkDelete.isPending || bulkStatus.isPending || syncScheduled.isPending

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (selected.size === articles.length) setSelected(new Set())
    else setSelected(new Set(articles.map((a) => a.id)))
  }

  const handleDelete = async (id: string) => {
    await confirm({
      title: 'Hapus Artikel',
      description: 'Artikel ini akan dihapus permanen.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
      onConfirm: async () => { await deleteArticle.mutateAsync(id); toast.success('Dihapus') },
    })
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    await confirm({
      title: `Hapus ${selected.size} artikel?`,
      description: 'Semua artikel terpilih akan dihapus permanen.',
      confirmText: `Hapus ${selected.size}`,
      cancelText: 'Batal',
      variant: 'destructive',
      onConfirm: async () => {
        await bulkDelete.mutateAsync(Array.from(selected))
        setSelected(new Set())
        toast.success(`${selected.size} artikel dihapus`)
      },
    })
  }

  const handleBulkPublish = async () => {
    if (selected.size === 0) return
    await bulkStatus.mutateAsync({ ids: Array.from(selected), status: 'PUBLISHED' })
    setSelected(new Set())
    toast.success('Status diperbarui ke Published')
  }

  const handleExportCSV = () => {
    if (articles.length === 0) return
    const rows = articles.map((a) => [a.title, a.status, a.wpSite?.name || '', a.tokensUsed || 0, a.createdAt].join(','))
    const csv = ['Title,Status,Site,Tokens,Created', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'articles.csv'
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Library
          </h1>
          <p className="text-slate-500 font-medium">Arsip konten AI — draft otomatis tersimpan dari Content Lab.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => syncScheduled.mutate()} disabled={isBusy} className="h-10 rounded-xl text-xs font-bold">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncScheduled.isPending ? 'animate-spin' : ''}`} /> Sync WP
          </Button>
          <Button onClick={() => router.push('/content-lab')} className="h-10 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold">
            <Plus className="h-4 w-4 mr-1.5" /> Buat Baru
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<FileText className="h-5 w-5 text-blue-600" />} value={stats.totalArticles} label="Total" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} value={stats.counts['PUBLISHED'] || 0} label="Published" />
          <StatCard icon={<Clock className="h-5 w-5 text-amber-600" />} value={stats.counts['DRAFT'] || 0} label="Draft" />
          <StatCard icon={<Coins className="h-5 w-5 text-violet-600" />} value={stats.totalTokens} label="Total Tokens" />
        </div>
      )}

      {/* Filters + Bulk */}
      <div className="flex flex-wrap items-center gap-3 glass p-4 rounded-2xl border-none">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Cari judul..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9 rounded-xl border-none bg-white/60" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[150px] rounded-xl border-none bg-white/60 text-xs font-bold">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={articles.length === 0} className="h-10 rounded-xl text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
        </Button>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="text-xs">{selected.size} dipilih</Badge>
            <Button size="sm" variant="outline" onClick={handleBulkPublish} className="h-8 text-xs">Publish</Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs">Hapus</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-3xl border-2 border-white/60 dark:border-white/20 overflow-hidden p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-10">
                <input type="checkbox" checked={selected.size === articles.length && articles.length > 0} onChange={toggleAll} className="h-4 w-4 rounded" />
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Judul</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Site</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Token</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Waktu</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" /></TableCell></TableRow>
            ) : articles.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center text-slate-400 text-sm">Belum ada artikel. Buat dari Content Lab.</TableCell></TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <input type="checkbox" checked={selected.has(article.id)} onChange={() => toggleSelect(article.id)} className="h-4 w-4 rounded" />
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="font-bold text-sm truncate text-slate-900 dark:text-white">{article.title}</p>
                    {article.sourceUrl && <p className="text-[10px] text-slate-400 truncate">{article.sourceUrl}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] font-bold uppercase tracking-wider border ${statusBadge(article.status)}`}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{article.wpSite?.name || '—'}</TableCell>
                  <TableCell><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{article.tokensUsed || 0}</span></TableCell>
                  <TableCell className="text-xs text-slate-400 whitespace-nowrap">{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem onClick={() => router.push(`/content-lab?id=${article.id}`)} className="cursor-pointer">
                          <Pencil className="h-4 w-4 mr-2" /> Edit di Lab
                        </DropdownMenuItem>
                        {article.wpPostUrl && (
                          <DropdownMenuItem onClick={() => window.open(article.wpPostUrl!, '_blank')} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" /> Lihat
                          </DropdownMenuItem>
                        )}
                        {article.wpSite?.url && article.wpPostId && (
                          <DropdownMenuItem onClick={() => window.open(`${article.wpSite!.url}/wp-admin/post.php?post=${article.wpPostId}&action=edit`, '_blank')} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Edit di WP
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(article.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <span className="text-xs text-slate-400">
              Halaman {meta.page} dari {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 text-xs">← Prev</Button>
              <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 text-xs">Next →</Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="glass rounded-2xl border-2 border-white/60 dark:border-white/20 p-5 flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">{icon}</div>
      <div>
        <p className="text-2xl font-black tracking-tighter">{value.toLocaleString()}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      </div>
    </div>
  )
}
