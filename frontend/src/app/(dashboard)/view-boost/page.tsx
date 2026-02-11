'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trash2, Plus, Zap, ShieldCheck, Loader2 } from 'lucide-react';
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
    const interval = setInterval(() => fetchJobs(false), 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async (showToast = false) => {
    try {
      const response = await api.get<{ data: ViewBoostJob[] }>('/view-boost/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (showToast) toast.error('Failed to fetch jobs');
    } finally {
      setIsTableLoading(false);
    }
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/view-boost/jobs', formData);
      setFormData({
        url: '',
        targetViews: 100,
        proxyList: '',
        serviceType: 'standard',
        delayMin: 5,
        delayMax: 30,
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setLoading(false);
    }
  };

  const startJob = async (id: string) => {
    try {
      await api.post(`/view-boost/jobs/${id}/start`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  const pauseJob = async (id: string) => {
    try {
      await api.post(`/view-boost/jobs/${id}/pause`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to pause job:', error);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await api.delete(`/view-boost/jobs/${id}`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500',
      running: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      paused: 'bg-gray-500',
    };
    return <Badge className={variants[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  return (
    <AdminGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">View Boost</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Job</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Target URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/article"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetViews">Target Views *</Label>
                  <Input
                    id="targetViews"
                    type="number"
                    min={1}
                    max={10000}
                    value={formData.targetViews}
                    onChange={(e) => setFormData({ ...formData, targetViews: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value: 'standard' | 'premium') => setFormData({ ...formData, serviceType: value })}
                  >
                    <SelectTrigger id="serviceType">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>Standard</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="premium">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          <span>Premium</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.serviceType === 'premium' && (
                <div className="space-y-2">
                  <Label htmlFor="proxyList">Proxy List (optional)</Label>
                  <Textarea
                    id="proxyList"
                    placeholder="http://user:pass@proxy1:8080&#10;http://proxy2:8080&#10;socks5://proxy3:1080"
                    value={formData.proxyList}
                    onChange={(e) => setFormData({ ...formData, proxyList: e.target.value })}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    One proxy per line. Format: http://host:port or socks5://host:port
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delayMin">Min Delay (seconds)</Label>
                  <Input
                    id="delayMin"
                    type="number"
                    min={1}
                    max={300}
                    value={formData.delayMin}
                    onChange={(e) => setFormData({ ...formData, delayMin: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delayMax">Max Delay (seconds)</Label>
                  <Input
                    id="delayMax"
                    type="number"
                    min={1}
                    max={300}
                    value={formData.delayMax}
                    onChange={(e) => setFormData({ ...formData, delayMax: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Job'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin !text-blue-600" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No jobs yet. Create one above!
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="max-w-xs truncate">{job.url}</TableCell>
                      <TableCell>
                        {job.serviceType === 'premium' ? (
                          <div className="flex items-center gap-1 text-blue-500 font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Premium</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-500 font-medium">
                            <Zap className="w-4 h-4" />
                            <span>Standard</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-sm">
                            {job.currentViews}/{job.targetViews}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {job.status === 'running' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseJob(job.id)}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : job.status === 'pending' || job.status === 'paused' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startJob(job.id)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteJob(job.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
