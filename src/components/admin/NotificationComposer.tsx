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
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase.functions.invoke('test-push-notification', {
        body: { 
          userId: user.id,
          title,
          body,
          icon,
        },
      });

      if (error) throw error;

      toast({
        title: '✅ Teste Enviado',
        description: 'Verifique se recebeu a notificação',
      });
    } catch (error) {
      console.error('Error testing notification:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar teste',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSend = async () => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase.functions.invoke('notify-all-users', {
        body: {
          title,
          body,
          icon,
          action_label: actionLabel || null,
          action_url: actionUrl || null,
        },
      });

      if (error) throw error;

      toast({
        title: '✅ Notificações Enviadas',
        description: 'Push notifications enviadas a todos os subscritores',
      });

      setTitle('');
      setBody('');
      setActionLabel('');
      setActionUrl('');
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar notificações',
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
