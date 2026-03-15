-- Delete all push subscriptions (they were created with old VAPID keys and cause 403 errors)
DELETE FROM public.push_subscriptions;

-- Delete orphan user_sessions that have no matching profile
DELETE FROM public.user_sessions
WHERE user_id NOT IN (SELECT id FROM public.profiles);