import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow, differenceInMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Filter, Bell, BellOff, RefreshCw, ChevronLeft, ChevronRight,
  MoreHorizontal, Ban, Trash2, Shield, ShieldOff, Send, UserX, Baby, Eye, Clock, Globe
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  mother_name: string | null;
  baby_name: string | null;
  baby_birth_date: string | null;
  created_at: string;
  dietary_preferences: string[] | null;
  timezone: string | null;
  is_banned?: boolean;
  banned_reason?: string | null;
  last_login?: string;
  last_active?: string;
  total_sessions?: number;
  device_info?: string;
  hasPush?: boolean;
  isAdmin?: boolean;
  recipeViewCount?: number;
}

const ITEMS_PER_PAGE = 15;

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pushFilter, setPushFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userRecipeViews, setUserRecipeViews] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [banReason, setBanReason] = useState('');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const [profilesRes, sessionsRes, pushSubsRes, adminRolesRes, recipeViewsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_sessions').select('*'),
        supabase.from('push_subscriptions').select('user_id'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        supabase.from('recipe_views').select('user_id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const pushUserIds = new Set(pushSubsRes.data?.map(p => p.user_id) || []);
      const adminUserIds = new Set(adminRolesRes.data?.map(r => r.user_id) || []);
      
      // Count recipe views per user
      const viewCounts: Record<string, number> = {};
      recipeViewsRes.data?.forEach(v => { viewCounts[v.user_id] = (viewCounts[v.user_id] || 0) + 1; });

      const usersWithData = profilesRes.data?.map(profile => {
        const session = sessionsRes.data?.find(s => s.user_id === profile.id);
        return {
          ...profile,
          last_login: session?.last_login,
          last_active: session?.last_active,
          total_sessions: session?.total_sessions || 0,
          device_info: session?.device_info,
          hasPush: pushUserIds.has(profile.id),
          isAdmin: adminUserIds.has(profile.id),
          recipeViewCount: viewCounts[profile.id] || 0,
        };
      }) || [];

      usersWithData.sort((a, b) => {
        if (a.last_active && b.last_active) return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        if (a.last_active) return -1;
        if (b.last_active) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openUserDetail = async (user: UserProfile) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
    
    // Fetch user's recipe views and activity in parallel
    const [viewsRes, activityRes] = await Promise.all([
      supabase.from('recipe_views').select('recipe_id, viewed_at').eq('user_id', user.id).order('viewed_at', { ascending: false }).limit(50),
      supabase.from('activity_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);
    setUserRecipeViews(viewsRes.data || []);
    setUserActivity(activityRes.data || []);
  };

  const executeAdminAction = async (action: string, targetUserId: string, extra?: any) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action, targetUserId, ...extra }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: '✅ Success', description: data.message || 'Action completed' });
      fetchUsers();
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Action failed', variant: 'destructive' });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUser) return;
    const success = await executeAdminAction('ban_user', selectedUser.id, { reason: banReason });
    if (success) { setBanDialogOpen(false); setBanReason(''); setSelectedUser(null); }
  };

  const handleUnban = async (userId: string) => { await executeAdminAction('unban_user', userId); };
  const handleDelete = async () => {
    if (!selectedUser) return;
    const success = await executeAdminAction('delete_user', selectedUser.id);
    if (success) { setDeleteDialogOpen(false); setSelectedUser(null); }
  };
  const handlePromote = async (userId: string) => { await executeAdminAction('promote_admin', userId); };
  const handleDemote = async (userId: string) => { await executeAdminAction('demote_admin', userId); };

  const handleSendNotification = async () => {
    if (!selectedUser || !notifyTitle || !notifyBody) return;
    const success = await executeAdminAction('send_notification', selectedUser.id, {
      notification: { title: notifyTitle, body: notifyBody }
    });
    if (success) { setNotifyDialogOpen(false); setNotifyTitle(''); setNotifyBody(''); setSelectedUser(null); }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.mother_name?.toLowerCase().includes(searchLower) ||
        user.baby_name?.toLowerCase().includes(searchLower);

      const lastActive = user.last_active ? new Date(user.last_active) : null;
      const minutesSinceActive = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60)) : null;
      const isOnlineNow = minutesSinceActive !== null && minutesSinceActive < 5;
      const isActive = minutesSinceActive !== null && minutesSinceActive < 60 * 24;
      
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'online' && isOnlineNow) ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive) ||
        (statusFilter === 'banned' && user.is_banned);

      const matchesPush = pushFilter === 'all' ||
        (pushFilter === 'enabled' && user.hasPush) ||
        (pushFilter === 'disabled' && !user.hasPush);

      return matchesSearch && matchesStatus && matchesPush;
    });
  }, [users, searchTerm, statusFilter, pushFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const onlineCount = users.filter(u => {
    const la = u.last_active ? new Date(u.last_active) : null;
    return la && Math.floor((Date.now() - la.getTime()) / 60000) < 5;
  }).length;

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, pushFilter]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  const getBabyAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const months = differenceInMonths(new Date(), new Date(birthDate));
    return months;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 flex-wrap text-base">
              User Management
              <Badge variant="outline" className="text-xs">{filteredUsers.length}/{users.length}</Badge>
              {onlineCount > 0 && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1" />
                  {onlineCount} online
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); fetchUsers(); }} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>

          <div className="flex flex-col gap-3 mt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, mother, baby..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-36"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="online">🟢 Online</SelectItem>
                <SelectItem value="active">Active (24h)</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">🚫 Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pushFilter} onValueChange={setPushFilter}>
              <SelectTrigger className="w-full md:w-36"><Bell className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="enabled">With Push</SelectItem>
                <SelectItem value="disabled">No Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Baby</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Push</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                ) : (
                  paginatedUsers.map((user) => {
                    const lastActive = user.last_active ? new Date(user.last_active) : null;
                    const minutesSinceActive = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 60000) : null;
                    const isOnlineNow = minutesSinceActive !== null && minutesSinceActive < 5;
                    const isActive = minutesSinceActive !== null && minutesSinceActive < 60 * 24;
                    const babyAge = getBabyAge(user.baby_birth_date);
                    
                    return (
                      <TableRow key={user.id} className={`cursor-pointer hover:bg-muted/50 ${user.is_banned ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`} onClick={() => openUserDetail(user)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isOnlineNow && <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                            <div>
                              <div className="font-medium text-sm flex items-center gap-1.5">
                                {user.full_name}
                                {user.isAdmin && <Shield className="h-3 w-3 text-purple-500" />}
                                {user.is_banned && <Ban className="h-3 w-3 text-red-500" />}
                              </div>
                              {user.mother_name && user.mother_name !== user.full_name && (
                                <div className="text-[10px] text-muted-foreground">👩 {user.mother_name}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            {user.baby_name && <div className="font-medium">👶 {user.baby_name}</div>}
                            {babyAge !== null && (
                              <div className="text-muted-foreground">{babyAge}m old</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOnlineNow ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">Online</Badge>
                          ) : isActive ? (
                            <Badge variant="outline" className="text-[10px]">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                          )}
                          {lastActive && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {minutesSinceActive !== null && minutesSinceActive < 60
                                ? `${minutesSinceActive}m ago`
                                : minutesSinceActive !== null && minutesSinceActive < 60 * 24
                                ? `${Math.floor(minutesSinceActive / 60)}h ago`
                                : formatDistanceToNow(lastActive, { addSuffix: true })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.hasPush ? (
                            <Bell className="h-4 w-4 text-green-500" />
                          ) : (
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1"><Eye className="h-3 w-3" />{user.recipeViewCount || 0}</div>
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{user.total_sessions || 0}s</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} disabled={actionLoading}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => openUserDetail(user)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.is_banned ? (
                                <DropdownMenuItem onClick={() => handleUnban(user.id)}><UserX className="h-4 w-4 mr-2" /> Unban</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => { setSelectedUser(user); setBanDialogOpen(true); }} className="text-amber-600">
                                  <Ban className="h-4 w-4 mr-2" /> Ban
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {user.isAdmin ? (
                                <DropdownMenuItem onClick={() => handleDemote(user.id)}><ShieldOff className="h-4 w-4 mr-2" /> Remove Admin</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handlePromote(user.id)}><Shield className="h-4 w-4 mr-2" /> Promote Admin</DropdownMenuItem>
                              )}
                              {user.hasPush && (
                                <DropdownMenuItem onClick={() => { setSelectedUser(user); setNotifyDialogOpen(true); }}>
                                  <Send className="h-4 w-4 mr-2" /> Send Notification
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.full_name}
              {selectedUser?.isAdmin && <Badge variant="outline" className="bg-purple-500/10 text-purple-600 text-xs"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
            </DialogTitle>
            <DialogDescription>User profile and activity details</DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* Profile Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mother</p>
                  <p className="text-sm font-medium">{selectedUser.mother_name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Baby</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Baby className="h-3.5 w-3.5" />
                    {selectedUser.baby_name || '—'}
                    {selectedUser.baby_birth_date && ` (${getBabyAge(selectedUser.baby_birth_date)}m)`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Timezone</p>
                  <p className="text-sm font-medium flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{selectedUser.timezone || 'UTC'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Device</p>
                  <p className="text-sm font-medium">{selectedUser.device_info || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Sessions</p>
                  <p className="text-sm font-medium">{selectedUser.total_sessions || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Push</p>
                  <p className="text-sm font-medium">{selectedUser.hasPush ? '✅ Active' : '❌ Not active'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Registered</p>
                  <p className="text-sm font-medium">{formatDistanceToNow(new Date(selectedUser.created_at), { addSuffix: true })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Active</p>
                  <p className="text-sm font-medium">{selectedUser.last_active ? formatDistanceToNow(new Date(selectedUser.last_active), { addSuffix: true }) : '—'}</p>
                </div>
                {selectedUser.dietary_preferences && selectedUser.dietary_preferences.length > 0 && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Dietary Preferences</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.dietary_preferences.map(p => (
                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recipe Views */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Eye className="h-4 w-4" /> Recipe Views ({userRecipeViews.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {userRecipeViews.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No recipe views</p>
                  ) : (
                    userRecipeViews.slice(0, 20).map((v, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                        <span className="truncate">{v.recipe_id}</span>
                        <span className="text-muted-foreground shrink-0">{v.viewed_at ? formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true }) : ''}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Clock className="h-4 w-4" /> Recent Activity ({userActivity.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {userActivity.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No activity logged</p>
                  ) : (
                    userActivity.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="text-[9px] shrink-0">{a.action_type}</Badge>
                          <span className="truncate text-muted-foreground">
                            {typeof a.action_details === 'object' && a.action_details?.path ? a.action_details.path : ''}
                          </span>
                        </div>
                        <span className="text-muted-foreground shrink-0">{a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : ''}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>Ban <strong>{selectedUser?.full_name}</strong>? They will be blocked from the app.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="banReason">Reason (optional)</Label>
            <Textarea id="banReason" placeholder="Reason..." value={banReason} onChange={(e) => setBanReason(e.target.value)} className="mt-2" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBan} disabled={actionLoading} className="bg-amber-500 hover:bg-amber-600">
              {actionLoading ? 'Banning...' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{selectedUser?.full_name}</strong>? Cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading} className="bg-red-500 hover:bg-red-600">
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notify Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send push to <strong>{selectedUser?.full_name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notifyTitle">Title</Label>
              <Input id="notifyTitle" placeholder="Title" value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="notifyBody">Message</Label>
              <Textarea id="notifyBody" placeholder="Message..." value={notifyBody} onChange={(e) => setNotifyBody(e.target.value)} className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleSendNotification} disabled={actionLoading || !notifyTitle || !notifyBody}>
              {actionLoading ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;
