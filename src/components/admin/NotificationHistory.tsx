import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, Bell } from 'lucide-react';

interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  action_label: string | null;
  action_url: string | null;
  created_at: string;
  created_by: string;
  recipients_count: number | null;
  successful_count: number | null;
  failed_count: number | null;
}

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhuma notificação enviada</p>
          <p className="text-sm text-muted-foreground">
            As notificações enviadas aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Histórico de Notificações
          <Badge variant="outline">{notifications.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Destinatários</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => {
                const successRate = notif.recipients_count 
                  ? Math.round(((notif.successful_count || 0) / notif.recipients_count) * 100)
                  : 0;
                
                return (
                  <TableRow key={notif.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {format(new Date(notif.created_at), 'dd/MM/yyyy', { locale: pt })}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(notif.created_at), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium max-w-[200px] truncate">
                        {notif.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-[250px] truncate">
                        {notif.body}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {notif.recipients_count || 0} destinatários
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {notif.successful_count !== null && notif.successful_count > 0 && (
                            <Badge variant="default" className="bg-green-500/10 text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {notif.successful_count}
                            </Badge>
                          )}
                          {notif.failed_count !== null && notif.failed_count > 0 && (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              {notif.failed_count}
                            </Badge>
                          )}
                          {notif.recipients_count === null && (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              A processar
                            </Badge>
                          )}
                        </div>
                        {notif.recipients_count && notif.recipients_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {successRate}% sucesso
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationHistory;
