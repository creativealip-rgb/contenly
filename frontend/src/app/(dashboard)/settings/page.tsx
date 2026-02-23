'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    User,
    Shield,
    Key,
    Bell,
    Link2,
    Camera,
    Eye,
    EyeOff,
    Copy,
    Trash2,
    Plus
} from 'lucide-react'

export default function SettingsPage() {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                    Settings
                </h1>
                <p className="text-slate-500 font-medium">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="api-keys" className="gap-2">
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline">API Keys</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="connections" className="gap-2">
                        <Link2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Connections</span>
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information and profile photo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                                        JD
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Button variant="outline" size="sm">
                                        <Camera className="h-4 w-4 mr-2" />
                                        Change Photo
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG or GIF. Max size 2MB.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Form Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" placeholder="John Doe" defaultValue="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" defaultValue="john@example.com" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Tell us about yourself..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Password & Security</CardTitle>
                            <CardDescription>
                                Keep your account secure with a strong password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            placeholder="Enter current password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="Enter new password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Keys Tab */}
                <TabsContent value="api-keys">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>API Keys</CardTitle>
                                <CardDescription>
                                    Manage API keys for external integrations.
                                </CardDescription>
                            </div>
                            <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Generate Key
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* API Key Item */}
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Production Key</span>
                                            <Badge variant="secondary">Active</Badge>
                                        </div>
                                        <code className="text-sm text-muted-foreground font-mono">
                                            sk_live_****************************abc1
                                        </code>
                                        <p className="text-xs text-muted-foreground">
                                            Created Jan 10, 2026 • Last used: 2 hours ago
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="text-red-600 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Development Key</span>
                                            <Badge variant="outline">Test</Badge>
                                        </div>
                                        <code className="text-sm text-muted-foreground font-mono">
                                            sk_test_****************************xyz2
                                        </code>
                                        <p className="text-xs text-muted-foreground">
                                            Created Jan 5, 2026 • Never used
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="text-red-600 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                Choose how you want to be notified.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {[
                                    { label: 'Article Published', description: 'When an article is successfully published to WordPress' },
                                    { label: 'Low Token Balance', description: 'When your token balance falls below 10' },
                                    { label: 'RSS Feed Errors', description: 'When there are issues polling your feeds' },
                                    { label: 'Weekly Summary', description: 'A weekly report of your content performance' },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                                        <div>
                                            <p className="font-medium">{item.label}</p>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" className="rounded" defaultChecked />
                                                Email
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" className="rounded" defaultChecked />
                                                In-app
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Connections Tab */}
                <TabsContent value="connections">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Connected Accounts</CardTitle>
                            <CardDescription>
                                Manage your OAuth connections.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: 'Google', connected: true, email: 'john@gmail.com' },
                                { name: 'GitHub', connected: false, email: null },
                            ].map((provider) => (
                                <div key={provider.name} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <span className="text-lg font-bold">{provider.name[0]}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{provider.name}</p>
                                            {provider.connected ? (
                                                <p className="text-sm text-muted-foreground">{provider.email}</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Not connected</p>
                                            )}
                                        </div>
                                    </div>
                                    {provider.connected ? (
                                        <Button variant="outline" className="text-red-600 hover:text-red-600">
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button variant="outline">Connect</Button>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
