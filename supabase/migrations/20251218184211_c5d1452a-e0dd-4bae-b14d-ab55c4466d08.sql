-- Schedule the rotate-challenges edge function to run daily at midnight UTC
SELECT cron.schedule(
  'rotate-weekly-challenges',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bdkfoxzlndwxvzbbrbgl.supabase.co/functions/v1/rotate-challenges',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJka2ZveHpsbmR3eHZ6YmJyYmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDEyODIsImV4cCI6MjA3NTc3NzI4Mn0.HRzvs3g2hhRHnebFSAr6LLIqOHcPWpOOrWI8UwAfYlc'
    ),
    body := '{}'::jsonb
  );
  $$
);