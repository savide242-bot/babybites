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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Filter, Bell, BellOff, RefreshCw, ChevronLeft, ChevronRight,
  MoreHorizontal, Ban, Trash2, Shield, ShieldOff, Send, UserX
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  mother_name: string | null;
  baby_name: string | null;
  created_at: string;
  dietary_preferences: string[] | null;
  is_banned?: boolean;
  banned_reason?: string | null;
  last_login?: string;
  last_active?: string;
  total_sessions?: number;
  hasPush?: boolean;
  isAdmin?: boolean;
}

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pushFilter, setPushFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState('');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Fetch profiles, sessions, push subscriptions, and admin roles in parallel
      const [profilesRes, sessionsRes, pushSubsRes, adminRolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_sessions').select('*'),
        supabase.from('push_subscriptions').select('user_id'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const pushUserIds = new Set(pushSubsRes.data?.map(p => p.user_id) || []);
      const adminUserIds = new Set(adminRolesRes.data?.map(r => r.user_id) || []);

      // Merge all data
      const usersWithData = profilesRes.data?.map(profile => {
        const session = sessionsRes.data?.find(s => s.user_id === profile.id);
        return {
          ...profile,
          last_login: session?.last_login,
          last_active: session?.last_active,
          total_sessions: session?.total_sessions || 0,
          hasPush: pushUserIds.has(profile.id),
          isAdmin: adminUserIds.has(profile.id),
        };
      }) || [];

      // Only show users with actual profiles (not ghost sessions)
      const realUsers = usersWithData;

      // Sort by last_active
      realUsers.sort((a, b) => {
        if (a.last_active && b.last_active) {
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        }
        if (a.last_active) return -1;
        if (b.last_active) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setUsers(realUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Real-time subscription
    const channel = supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, fetchUsers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const executeAdminAction = async (action: string, targetUserId: string, extra?: any) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action, targetUserId, ...extra }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: '✅ Success',
        description: data.message || 'Action completed successfully',
      });

      fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Admin action error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Action failed',
        variant: 'destructive',
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUser) return;
    const success = await executeAdminAction('ban_user', selectedUser.id, { reason: banReason });
    if (success) {
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUser(null);
    }
  };

  const handleUnban = async (userId: string) => {
    await executeAdminAction('unban_user', userId);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const success = await executeAdminAction('delete_user', selectedUser.id);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handlePromote = async (userId: string) => {
    await executeAdminAction('promote_admin', userId);
  };

  const handleDemote = async (userId: string) => {
    await executeAdminAction('demote_admin', userId);
  };

  const handleSendNotification = async () => {
    if (!selectedUser || !notifyTitle || !notifyBody) return;
    const success = await executeAdminAction('send_notification', selectedUser.id, {
      notification: { title: notifyTitle, body: notifyBody }
    });
    if (success) {
      setNotifyDialogOpen(false);
      setNotifyTitle('');
      setNotifyBody('');
      setSelectedUser(null);
    }
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.mother_name?.toLowerCase().includes(searchLower) ||
        user.baby_name?.toLowerCase().includes(searchLower);

      const lastActive = user.last_active ? new Date(user.last_active) : null;
      const minutesSinceActive = lastActive 
        ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60))
        : null;
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

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Count online users
  const onlineCount = users.filter(u => {
    const lastActive = u.last_active ? new Date(u.last_active) : null;
    const minutesSinceActive = lastActive 
      ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60))
      : null;
    return minutesSinceActive !== null && minutesSinceActive < 5;
  }).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pushFilter]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              User Management
              <Badge variant="outline" className="text-sm">
                {filteredUsers.length} de {users.length}
              </Badge>
              {onlineCount > 0 && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
                  {onlineCount} online
                </Badge>
              )}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, mother or baby..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="online">🟢 Online</SelectItem>
                <SelectItem value="active">Activos (24h)</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="banned">🚫 Banidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pushFilter} onValueChange={setPushFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Bell className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Push" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enabled">Com Push</SelectItem>
                <SelectItem value="disabled">Sem Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Mãe/Bebé</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Push</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead>Registo</TableHead>
                  <TableHead>Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum utilizador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => {
                    const lastActive = user.last_active ? new Date(user.last_active) : null;
                    const minutesSinceActive = lastActive 
                      ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60))
                      : null;
                    const isOnlineNow = minutesSinceActive !== null && minutesSinceActive < 5;
                    const isActive = minutesSinceActive !== null && minutesSinceActive < 60 * 24;
                    
                    return (
                      <TableRow key={user.id} className={user.is_banned ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isOnlineNow && (
                              <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            )}
                            {user.full_name}
                            {user.isAdmin && (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {user.is_banned && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                Banido
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {user.mother_name && (
                              <div className="text-muted-foreground">👩 {user.mother_name}</div>
                            )}
                            {user.baby_name && (
                              <div className="text-muted-foreground">👶 {user.baby_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOnlineNow ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              🟢 Online
                            </Badge>
                          ) : isActive ? (
                            <Badge variant="outline">🔵 Activo</Badge>
                          ) : (
                            <Badge variant="secondary">⚫ Inactivo</Badge>
                          )}
                          {lastActive && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {minutesSinceActive !== null && minutesSinceActive < 60
                                ? `${minutesSinceActive}m atrás`
                                : minutesSinceActive !== null && minutesSinceActive < 60 * 24
                                ? `${Math.floor(minutesSinceActive / 60)}h atrás`
                                : formatDistanceToNow(lastActive, { addSuffix: true })
                              }
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.hasPush ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <Bell className="h-3 w-3 mr-1" /> Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <BellOff className="h-3 w-3 mr-1" /> Não
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.total_sessions || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={actionLoading}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.is_banned ? (
                                <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                                  <UserX className="h-4 w-4 mr-2" /> Desbanir
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => { setSelectedUser(user); setBanDialogOpen(true); }}
                                  className="text-amber-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" /> Banir
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              {user.isAdmin ? (
                                <DropdownMenuItem onClick={() => handleDemote(user.id)}>
                                  <ShieldOff className="h-4 w-4 mr-2" /> Remover Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handlePromote(user.id)}>
                                  <Shield className="h-4 w-4 mr-2" /> Promover Admin
                                </DropdownMenuItem>
                              )}
                              
                              {user.hasPush && (
                                <DropdownMenuItem 
                                  onClick={() => { setSelectedUser(user); setNotifyDialogOpen(true); }}
                                >
                                  <Send className="h-4 w-4 mr-2" /> Enviar Notificação
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Remover
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Banir Utilizador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja banir <strong>{selectedUser?.full_name}</strong>?
              O utilizador será impedido de aceder à aplicação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="banReason">Motivo (opcional)</Label>
            <Textarea
              id="banReason"
              placeholder="Infracção das regras da comunidade..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBan} 
              disabled={actionLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {actionLoading ? 'A banir...' : 'Banir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Utilizador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover permanentemente <strong>{selectedUser?.full_name}</strong>?
              Esta acção não pode ser desfeita e todos os dados do utilizador serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading ? 'A remover...' : 'Remover Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notify Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificação</DialogTitle>
            <DialogDescription>
              Enviar uma notificação push para <strong>{selectedUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notifyTitle">Título</Label>
              <Input
                id="notifyTitle"
                placeholder="Título da notificação"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="notifyBody">Mensagem</Label>
              <Textarea
                id="notifyBody"
                placeholder="Conteúdo da notificação..."
                value={notifyBody}
                onChange={(e) => setNotifyBody(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={actionLoading || !notifyTitle || !notifyBody}
            >
              {actionLoading ? 'A enviar...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;
