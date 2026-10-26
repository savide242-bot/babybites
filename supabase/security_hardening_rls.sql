-- ==============================================================================
-- BABYBITES MAXIMUM SECURITY HARDENING & RLS POLICY SUITE (SUPABASE / POSTGRES)
-- Proteção Máxima contra Invasões, Vazamentos de Dados e Acesso Não Autorizado
-- ==============================================================================

-- 1. HELPER SECURITY FUNCTIONS (SECURITY DEFINER)
-- Verifica se o usuário atual é um dos Super Admins autorizados
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_email TEXT;
  user_has_admin_role BOOLEAN;
BEGIN
  -- Extrai email seguro do JWT criptografado da sessão
  current_email := LOWER(COALESCE(auth.jwt()->>'email', ''));
  
  -- Whitelist mestre de administradores
  IF current_email IN ('octaviomoiane2007@gmail.com', 'savide242@gmail.com') THEN
    RETURN TRUE;
  END IF;

  -- Verifica papel na tabela user_roles
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO user_has_admin_role;

  RETURN COALESCE(user_has_admin_role, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verifica se o usuário autenticado está suspenso/banido da plataforma
CREATE OR REPLACE FUNCTION public.is_user_suspended()
RETURNS BOOLEAN AS $$
DECLARE
  suspended BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(is_suspended, FALSE) INTO suspended
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(suspended, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS SENSÍVEIS
-- ==============================================================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.food_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.baby_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorite_recipes ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLÍTICAS DE BLINDAGEM: PROFILES (DADOS PESSOAIS DE MÃES)
-- ==============================================================================

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- Mães podem ver perfis públicos de outras mães (nome, bio, baby)
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (true);

-- Uma mãe só pode editar o seu PRÓPRIO perfil
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id AND NOT public.is_user_suspended()
) WITH CHECK (
  auth.uid() = id AND NOT public.is_user_suspended()
);

-- Super Admin tem controle total para banir ou auditar perfis
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL USING (public.is_super_admin());

-- ==============================================================================
-- 4. POLÍTICAS DE BLINDAGEM: MENSAGENS DIRETAS (DMS PRIVADAS ENTRE MÃES)
-- ==============================================================================

DROP POLICY IF EXISTS "dm_select_only_participants" ON public.community_direct_messages;
DROP POLICY IF EXISTS "dm_insert_only_sender" ON public.community_direct_messages;
DROP POLICY IF EXISTS "dm_update_only_recipient" ON public.community_direct_messages;
DROP POLICY IF EXISTS "dm_delete_own_or_admin" ON public.community_direct_messages;

-- APENAS quem enviou ou quem recebeu pode ler a mensagem (Hackers são bloqueados)
CREATE POLICY "dm_select_only_participants" ON public.community_direct_messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id OR public.is_super_admin()
);

-- Somente o usuário logado e não-suspenso pode enviar mensagens em seu nome
CREATE POLICY "dm_insert_only_sender" ON public.community_direct_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND NOT public.is_user_suspended()
);

-- O destinatário pode atualizar a mensagem (para marcar como lida)
CREATE POLICY "dm_update_only_recipient" ON public.community_direct_messages
FOR UPDATE USING (
  auth.uid() = recipient_id
) WITH CHECK (
  auth.uid() = recipient_id
);

-- Apenas o autor ou admin pode apagar a mensagem
CREATE POLICY "dm_delete_own_or_admin" ON public.community_direct_messages
FOR DELETE USING (
  auth.uid() = sender_id OR public.is_super_admin()
);

-- ==============================================================================
-- 5. POLÍTICAS DE BLINDAGEM: COMUNIDADE, STORIES E POSTS
-- ==============================================================================

DROP POLICY IF EXISTS "posts_select_public" ON public.forum_posts;
DROP POLICY IF EXISTS "posts_insert_auth" ON public.forum_posts;
DROP POLICY IF EXISTS "posts_update_own_or_admin" ON public.forum_posts;
DROP POLICY IF EXISTS "posts_delete_own_or_admin" ON public.forum_posts;

-- Qualquer pessoa pode ver posts publicados; posts ocultos/em análise só autor ou admin
CREATE POLICY "posts_select_public" ON public.forum_posts
FOR SELECT USING (
  status = 'published' OR auth.uid() = user_id OR public.is_super_admin()
);

-- Apenas usuários autenticados e não suspensos podem publicar
CREATE POLICY "posts_insert_auth" ON public.forum_posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND NOT public.is_user_suspended()
);

-- Somente o autor ou admin pode editar um post
CREATE POLICY "posts_update_own_or_admin" ON public.forum_posts
FOR UPDATE USING (
  auth.uid() = user_id OR public.is_super_admin()
);

-- Somente o autor ou admin pode excluir um post
CREATE POLICY "posts_delete_own_or_admin" ON public.forum_posts
FOR DELETE USING (
  auth.uid() = user_id OR public.is_super_admin()
);

-- STORIES (Expiração e Permissões)
DROP POLICY IF EXISTS "stories_select_active" ON public.community_stories;
DROP POLICY IF EXISTS "stories_insert_auth" ON public.community_stories;
DROP POLICY IF EXISTS "stories_delete_own_or_admin" ON public.community_stories;

CREATE POLICY "stories_select_active" ON public.community_stories
FOR SELECT USING (
  expires_at > NOW() OR public.is_super_admin()
);

CREATE POLICY "stories_insert_auth" ON public.community_stories
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND NOT public.is_user_suspended()
);

CREATE POLICY "stories_delete_own_or_admin" ON public.community_stories
FOR DELETE USING (
  auth.uid() = user_id OR public.is_super_admin()
);

-- ==============================================================================
-- 6. POLÍTICAS DE BLINDAGEM TOTAL: TABELAS DO PAINEL ADMIN
-- Usuários comuns recebem DENY imediato em consultas a logs e alertas
-- ==============================================================================

DROP POLICY IF EXISTS "admin_alerts_superadmin_only" ON public.community_admin_alerts;
DROP POLICY IF EXISTS "activity_logs_superadmin_only" ON public.activity_logs;
DROP POLICY IF EXISTS "admin_notifications_superadmin_only" ON public.admin_notifications;
DROP POLICY IF EXISTS "user_roles_superadmin_only" ON public.user_roles;

-- Somente Super Admins podem ver alertas de moderação
CREATE POLICY "admin_alerts_superadmin_only" ON public.community_admin_alerts
FOR ALL USING (public.is_super_admin());

-- Somente Super Admins podem auditar logs de atividade
CREATE POLICY "activity_logs_superadmin_only" ON public.activity_logs
FOR SELECT USING (public.is_super_admin());

-- Somente Super Admins podem compor e ler notificações administrativas
CREATE POLICY "admin_notifications_superadmin_only" ON public.admin_notifications
FOR ALL USING (public.is_super_admin());

-- Ninguém exceto Super Admin pode ler ou manipular papéis de usuário
CREATE POLICY "user_roles_superadmin_only" ON public.user_roles
FOR ALL USING (public.is_super_admin());

-- ==============================================================================
-- 7. DIÁRIO ALIMENTAR & DADOS PRIVADOS DO BEBÊ
-- Uma mãe NUNCA pode ver o diário ou crescimento do bebê de outra mãe
-- ==============================================================================

DROP POLICY IF EXISTS "food_diary_own_only" ON public.food_diary;
DROP POLICY IF EXISTS "baby_growth_own_only" ON public.baby_growth;

CREATE POLICY "food_diary_own_only" ON public.food_diary
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "baby_growth_own_only" ON public.baby_growth
FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 8. STORAGE BUCKET SECURITY POLICIES (community_media)
-- ==============================================================================

-- Permitir leitura pública dos ficheiros de mídia
DROP POLICY IF EXISTS "public_view_media" ON storage.objects;
CREATE POLICY "public_view_media" ON storage.objects
FOR SELECT USING (bucket_id = 'community_media');

-- Permitir upload apenas para usuários autenticados não-suspensos
DROP POLICY IF EXISTS "auth_upload_media" ON storage.objects;
CREATE POLICY "auth_upload_media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'community_media' 
  AND auth.role() = 'authenticated'
  AND NOT public.is_user_suspended()
);

-- Permitir exclusão apenas pelo autor ou super admin
DROP POLICY IF EXISTS "auth_delete_own_media" ON storage.objects;
CREATE POLICY "auth_delete_own_media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'community_media'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin())
);
