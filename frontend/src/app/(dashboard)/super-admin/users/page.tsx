'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SuperAdminGuard } from '@/components/guards'
import {
    Users,
    Trash2,
    ShieldAlert,
    ShieldCheck,
    User,
    Plus,
    Coins,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface TokenBalance {
    balance: number
}

interface UserData {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
    tokenBalance?: TokenBalance
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [tokenAmount, setTokenAmount] = useState<number>(1000)
    const [isAddingTokens, setIsAddingTokens] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)

    // Create User States
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    })

    // Search & Pagination States
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const fetchUsers = async () => {
        try {
            setLoading(true)
            console.log('[UserManagementPage] Fetching users...');
            const response = await api.get<any>('/users/admin/list')
            console.log('[UserManagementPage] Raw API Response:', response);

            // Handle both raw array and { data: [] } formats
            const userData = Array.isArray(response) ? response : (response?.data || [])
            console.log('[UserManagementPage] Parsed User Data:', userData);

            setUsers(userData)
        } catch (error) {
            console.error('[UserManagementPage] Failed to fetch users:', error)
            toast.error('Gagal mengambil data user')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email) {
            toast.error('Nama dan email wajib diisi')
            return
        }

        try {
            setIsCreating(true)
            await api.post('/users/admin/users', newUser)
            toast.success('User berhasil dibuat')
            setIsCreateDialogOpen(false)
            setNewUser({ name: '', email: '', password: '', role: 'USER' })
            fetchUsers()
        } catch (error: any) {
            console.error('Failed to create user:', error)
            toast.error(error.message || 'Gagal membuat user')
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await api.patch(`/users/admin/${userId}/role`, { role: newRole })
            toast.success(`Role user berhasil diubah ke ${newRole}`)
            fetchUsers()
        } catch (error) {
            console.error('Failed to update role:', error)
            toast.error('Gagal mengubah role user')
        }
    }

    const handleAddTokens = async () => {
        if (!selectedUser) return

        try {
            setIsAddingTokens(true)
            await api.patch(`/users/admin/${selectedUser.id}/tokens`, { amount: tokenAmount })
            toast.success(`Berhasil menambahkan ${tokenAmount} token ke ${selectedUser.name}`)
            setIsAddingTokens(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (error) {
            console.error('Failed to add tokens:', error)
            toast.error('Gagal menambahkan token')
            setIsAddingTokens(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

        try {
            await api.delete(`/users/admin/${userId}`)
            toast.success('User berhasil dihapus')
            fetchUsers()
        } catch (error) {
            console.error('Failed to delete user:', error)
            toast.error('Gagal menghapus user')
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Badge className="bg-red-500 hover:bg-red-600"><ShieldAlert className="w-3 h-3 mr-1" /> Super Admin</Badge>
            case 'ADMIN':
                return <Badge className="bg-blue-500 hover:bg-blue-600"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</Badge>
            default:
                return <Badge variant="secondary"><User className="w-3 h-3 mr-1" /> User</Badge>
        }
    }

    // Filtered and Paginated Users
    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

    // Reset pagination when searching
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    return (
        <SuperAdminGuard>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" /> Tambah User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Buat User Baru</DialogTitle>
                                <DialogDescription>
                                    Tambah user baru secara manual ke sistem.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Nama Lengkap</Label>
                                    <Input
                                        placeholder="Jhon Doe"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="jhon@example.com"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password (Opsional)</Label>
                                    <Input
                                        type="password"
                                        placeholder="Minimal 8 karakter"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={handleCreateUser}
                                    disabled={isCreating}
                                >
                                    {isCreating ? 'Creating...' : 'Buat User'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle>Daftar Seluruh User</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Cari nama atau email..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Tokens</TableHead>
                                    <TableHead>Terdaftar</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            {searchQuery ? 'Tidak ada user yang cocok dengan pencarian.' : 'Tidak ada user ditemukan.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Coins className="w-4 h-4 text-yellow-500" />
                                                    <span className="font-mono">{user.tokenBalance?.balance || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                                            <Plus className="w-4 h-4 mr-2" /> Tambah Token
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'USER')}>
                                                            Ubah ke USER
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'ADMIN')}>
                                                            Ubah ke ADMIN
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'SUPER_ADMIN')}>
                                                            Ubah ke SUPER_ADMIN
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Hapus User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        {!loading && totalPages > 1 && (
                            <div className="flex items-center justify-between py-4">
                                <p className="text-sm text-muted-foreground">
                                    Show <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong>
                                </p>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                    </Button>
                                    <span className="text-sm font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Adding Token Dialog (hidden) */}
                        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Tambah Token</DialogTitle>
                                    <DialogDescription>
                                        Tambahkan token manual untuk <strong>{selectedUser?.name}</strong>.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Jumlah Token</Label>
                                        <Input
                                            type="number"
                                            value={tokenAmount}
                                            onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                        Token saat ini: <strong>{selectedUser?.tokenBalance?.balance || 0}</strong>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setSelectedUser(null)}>Batal</Button>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={handleAddTokens}
                                        disabled={isAddingTokens}
                                    >
                                        {isAddingTokens ? 'Adding...' : 'Tambah Token'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminGuard>
    )
}
