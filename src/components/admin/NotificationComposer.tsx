import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Send, Eye, TestTube, History, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NotificationHistory from './NotificationHistory';

const NotificationComposer = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [icon, setIcon] = useState('/icon-192x192.png');
  const [actionLabel, setActionLabel] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    console.log('🧪 [TEST] Starting test notification...');
    
    if (!title || !body) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título e mensagem',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🧪 [TEST] User:', user?.id);
      if (!user) throw new Error('Não autenticado');

      const payload = { 
        userId: user.id,
        title,
        body,
        icon,
      };
      console.log('🧪 [TEST] Payload:', payload);

      const { data, error } = await supabase.functions.invoke('test-push-notification', {
        body: payload,
      });

      console.log('🧪 [TEST] Response data:', data);
      console.log('🧪 [TEST] Response error:', error);

      if (error) throw error;

      toast({
        title: '✅ Teste Enviado',
        description: `Notificação enviada! Resposta: ${JSON.stringify(data).slice(0, 100)}`,
      });
    } catch (error: any) {
      console.error('🧪 [TEST] Exception:', error);
      toast({
        title: 'Erro no Teste',
        description: `${error?.message || 'Falha'} - Ver console para detalhes`,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSend = async () => {
    console.log('📤 [SEND] Starting send to all...');
    
    if (!title || !body) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título e mensagem',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // First refresh the session to ensure valid token
      console.log('📤 [SEND] Refreshing session...');
      const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('📤 [SEND] Session refresh failed:', refreshError);
      } else {
        console.log('📤 [SEND] Session refreshed successfully');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('📤 [SEND] User:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('Não autenticado - faça login novamente');
      }

      // Check admin role before sending
      console.log('📤 [SEND] Checking admin role...');
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      console.log('📤 [SEND] Role check:', { roleData, roleError });
      
      if (roleError || !roleData) {
        throw new Error('Sem permissão admin - verifique o seu role na base de dados');
      }

      const payload = {
        title,
        body,
        icon,
        action_label: actionLabel || null,
        action_url: actionUrl || null,
      };
      console.log('📤 [SEND] Payload:', payload);

      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('notify-all-users', {
        body: payload,
      });
      const duration = Date.now() - startTime;

      console.log('📤 [SEND] Response data:', data);
      console.log('📤 [SEND] Response error:', error);
      console.log('📤 [SEND] Duration:', duration, 'ms');

      if (error) {
        console.error('📤 [SEND] Function error:', error);
        throw new Error(error.message || JSON.stringify(error));
      }

      if (data?.error) {
        console.error('📤 [SEND] Response contains error:', data.error);
        throw new Error(data.error);
      }

      const successCount = data?.successful || 0;
      const failedCount = data?.failed || 0;
      const expiredCount = data?.expired || 0;

      toast({
        title: '✅ Notificações Enviadas',
        description: `Enviadas: ${successCount} | Falhadas: ${failedCount} | Expiradas: ${expiredCount} | Tempo: ${duration}ms`,
      });

      setTitle('');
      setBody('');
      setActionLabel('');
      setActionUrl('');
    } catch (error: any) {
      console.error('📤 [SEND] Exception:', error);
      toast({
        title: 'Erro ao Enviar',
        description: error?.message || 'Falha desconhecida - Ver console',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Tabs defaultValue="compose" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="compose" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Compor
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="compose" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Enviar Push Notification</CardTitle>
            <CardDescription>
              Envie uma notificação push a todos os utilizadores subscritos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nova Funcionalidade!"
                maxLength={50}
              />
              <span className="text-xs text-muted-foreground">{title.length}/50</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Mensagem *</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ex: Confira a nossa nova colecção de receitas..."
                rows={4}
                maxLength={200}
              />
              <span className="text-xs text-muted-foreground">{body.length}/200</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">URL do Ícone</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="/icon-192x192.png"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actionLabel">Texto do Botão (opcional)</Label>
                <Input
                  id="actionLabel"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="Ex: Ver Agora"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionUrl">URL de Acção (opcional)</Label>
                <Input
                  id="actionUrl"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="Ex: /recipes"
                />
              </div>
            </div>

            {/* Preview */}
            {preview && title && body && (
              <Alert className="bg-muted/50">
                <AlertDescription>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold">{title}</div>
                      <div className="text-sm text-muted-foreground">{body}</div>
                      {actionLabel && (
                        <div className="text-xs text-primary font-medium mt-2">
                          [{actionLabel}]
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setPreview(!preview)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                {preview ? 'Esconder' : 'Ver'} Preview
              </Button>
              <Button
                onClick={handleTest}
                variant="secondary"
                disabled={testing || !title || !body}
                className="flex-1"
              >
                <TestTube className="mr-2 h-4 w-4" />
                {testing ? 'A testar...' : 'Testar em Mim'}
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !title || !body}
                className="flex-1"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'A enviar...' : 'Enviar a Todos'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <NotificationHistory />
      </TabsContent>
    </Tabs>
  );
};

export default NotificationComposer;
