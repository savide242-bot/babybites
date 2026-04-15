
-- Step 1: Add new flat columns
ALTER TABLE public.push_subscriptions 
  ADD COLUMN IF NOT EXISTS p256dh text,
  ADD COLUMN IF NOT EXISTS auth text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Maputo';

-- Step 2: Migrate existing data from keys jsonb to flat columns
UPDATE public.push_subscriptions
SET 
  p256dh = keys->>'p256dh',
  auth = keys->>'auth'
WHERE keys IS NOT NULL AND p256dh IS NULL;

-- Step 3: Make new columns required
ALTER TABLE public.push_subscriptions 
  ALTER COLUMN p256dh SET NOT NULL,
  ALTER COLUMN auth SET NOT NULL;

-- Step 4: Drop old keys column
ALTER TABLE public.push_subscriptions DROP COLUMN IF EXISTS keys;

-- Step 5: Add unique constraint on user_id + endpoint
ALTER TABLE public.push_subscriptions 
  ADD CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint);
