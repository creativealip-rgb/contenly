'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trash2, Plus, Zap, ShieldCheck, Loader2, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminGuard } from '@/components/guards';
import { toast } from 'sonner';

interface ViewBoostJob {
  id: string;
  url: string;
  targetViews: number;
  currentViews: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  serviceType: 'standard' | 'premium';
  progress: number;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
} as const

export default function ViewBoostPage() {
  const [jobs, setJobs] = useState<ViewBoostJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [formData, setFormData] = useState({
    url: '',
    targetViews: 100,
    proxyList: '',
    serviceType: 'standard' as 'standard' | 'premium',
    delayMin: 5,
    delayMax: 30,
  });

  useEffect(() => {
    fetchJobs(true);
    const interval = setInterval(() => fetchJobs(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async (showToast = false) => {
    try {
      const response = await api.get<{ data: ViewBoostJob[] }>('/view-boost/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (showToast) toast.error('Gagal mengambil pekerjaan');
    } finally {
      setIsTableLoading(false);
    }
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/view-boost/jobs', formData);
      setFormData({ url: '', targetViews: 100, proxyList: '', serviceType: 'standard', delayMin: 5, delayMax: 30 });
      fetchJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setLoading(false);
    }
  };

  const startJob = async (id: string) => {
    try { await api.post(`/view-boost/jobs/${id}/start`); fetchJobs(); }
    catch (error) { console.error('Failed to start job:', error); }
  };

  const pauseJob = async (id: string) => {
    try { await api.post(`/view-boost/jobs/${id}/pause`); fetchJobs(); }
    catch (error) { console.error('Failed to pause job:', error); }
  };

  const deleteJob = async (id: string) => {
    try { await api.delete(`/view-boost/jobs/${id}`); fetchJobs(); }
    catch (error) { console.error('Failed to delete job:', error); }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      running: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      failed: 'bg-red-500/10 text-red-600 border-red-500/20',
      paused: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    return <Badge className={variants[status] || 'bg-gray-500/10 text-gray-600'}>{status}</Badge>;
  };

  return (
    <AdminGuard>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              View Boost
            </h1>
            <p className="text-slate-500 font-medium">Tingkatkan tayangan artikel Anda dengan lalu lintas otomatis.</p>
          </div>
        </div>

        {/* Create Job Form */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Buat Pekerjaan Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL Target *</Label>
                    <Input id="url" type="url" placeholder="https://example.com/article" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetViews">Target Tayangan *</Label>
                    <Input id="targetViews" type="number" min={1} max={10000} value={formData.targetViews} onChange={(e) => setFormData({ ...formData, targetViews: parseInt(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Jenis Layanan *</Label>
                    <Select value={formData.serviceType} onValueChange={(value: 'standard' | 'premium') => setFormData({ ...formData, serviceType: value })}>
                      <SelectTrigger id="serviceType"><SelectValue placeholder="Pilih jenis layanan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /><span>Standar</span></div></SelectItem>
                        <SelectItem value="premium"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" /><span>Premium</span></div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.serviceType === 'premium' && (
                  <div className="space-y-2">
                    <Label htmlFor="proxyList">Daftar Proksi (opsional)</Label>
                    <Textarea id="proxyList" placeholder="http://user:pass@proxy1:8080&#10;http://proxy2:8080" value={formData.proxyList} onChange={(e) => setFormData({ ...formData, proxyList: e.target.value })} rows={4} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delayMin">Penundaan Minimum (detik)</Label>
                    <Input id="delayMin" type="number" min={1} max={300} value={formData.delayMin} onChange={(e) => setFormData({ ...formData, delayMin: parseInt(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delayMax">Penundaan Maksimum (detik)</Label>
                    <Input id="delayMax" type="number" min={1} max={300} value={formData.delayMax} onChange={(e) => setFormData({ ...formData, delayMax: parseInt(e.target.value) })} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Membuat...' : 'Buat Pekerjaan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Jobs Table */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Pekerjaan Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>URL</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Kemajuan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTableLoading ? (
                    <TableRow><TableCell colSpan={6} className="py-12 text-center"><div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" /></div></TableCell></TableRow>
                  ) : jobs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada pekerjaan. Buat satu di atas!</TableCell></TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="max-w-xs truncate">{job.url}</TableCell>
                        <TableCell>
                          {job.serviceType === 'premium' ? (
                            <div className="flex items-center gap-1 text-blue-500 font-medium"><ShieldCheck className="w-4 h-4" /><span>Premium</span></div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-500 font-medium"><Zap className="w-4 h-4" /><span>Standar</span></div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${job.progress}%` }} />
                            </div>
                            <span className="text-sm tabular-nums">{job.currentViews}/{job.targetViews}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {job.status === 'running' ? (
                              <Button size="sm" variant="outline" onClick={() => pauseJob(job.id)}><Pause className="w-4 h-4" /></Button>
                            ) : job.status === 'pending' || job.status === 'paused' ? (
                              <Button size="sm" variant="outline" onClick={() => startJob(job.id)}><Play className="w-4 h-4" /></Button>
                            ) : null}
                            <Button size="sm" variant="destructive" onClick={() => deleteJob(job.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AdminGuard>
  );
}
