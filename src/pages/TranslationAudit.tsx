import { useEffect, useMemo, useState } from 'react';
import { recipes } from '@/data/recipes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface Row {
  id: string;
  field: 'title' | 'description';
  text: string;
  translation?: string;
  status: 'missing' | 'translated';
}

const CACHE_KEY = 'auto_tx_es_v1';

const loadCache = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
};

const TranslationAudit = () => {
  const { language } = useLanguage();
  const [cache, setCache] = useState<Record<string, string>>(loadCache());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => { setCache(loadCache()); }, []);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const r of recipes) {
      if (r.title) {
        const tx = cache[r.title.trim()];
        out.push({ id: r.id, field: 'title', text: r.title, translation: tx, status: tx ? 'translated' : 'missing' });
      }
      if (r.description) {
        const tx = cache[r.description.trim()];
        out.push({ id: r.id, field: 'description', text: r.description, translation: tx, status: tx ? 'translated' : 'missing' });
      }
    }
    return out;
  }, [cache]);

  const missing = rows.filter(r => r.status === 'missing');
  const total = rows.length;
  const coverage = total ? Math.round(((total - missing.length) / total) * 100) : 100;

  const runFix = async () => {
    if (missing.length === 0) return;
    setRunning(true);
    setProgress(0);
    const BATCH = 40;
    const items = missing.map(m => ({ key: `recipe:${m.id}:${m.field}`, text: m.text }));
    const local = { ...cache };
    try {
      for (let i = 0; i < items.length; i += BATCH) {
        const chunk = items.slice(i, i + BATCH);
        const { data } = await supabase.functions.invoke('translate-content', {
          body: { items: chunk, targetLanguage: 'es' },
        });
        const translations: Record<string, string> = data?.translations ?? {};
        chunk.forEach(c => {
          const tx = translations[c.key];
          if (tx) local[c.text.trim()] = tx;
        });
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(local)); } catch {}
        setCache({ ...local });
        setProgress(Math.min(100, Math.round(((i + chunk.length) / items.length) * 100)));
        await new Promise(r => setTimeout(r, 250));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-32">
      <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>
      <h1 className="text-2xl font-bold mb-2">Auditoría de Traducciones</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Idioma actual: <Badge variant="outline">{language.toUpperCase()}</Badge>. Esta página muestra qué títulos/descripciones de recetas aún no tienen traducción al español en la caché del dispositivo.
      </p>

      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-3xl font-bold">{coverage}%</div>
            <div className="text-sm text-muted-foreground">
              {total - missing.length}/{total} campos traducidos
            </div>
          </div>
          <div className="flex items-center gap-2">
            {missing.length === 0 ? (
              <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> Completo</Badge>
            ) : (
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> {missing.length} faltantes</Badge>
            )}
            <Button onClick={runFix} disabled={running || missing.length === 0} size="sm">
              {running ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traduciendo {progress}%</>) : 'Traducir faltantes'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto">
          {missing.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Todas las recetas están traducidas en este dispositivo. 🎉
            </div>
          ) : (
            <ul className="divide-y">
              {missing.slice(0, 200).map((m, i) => (
                <li key={`${m.id}-${m.field}-${i}`} className="p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{m.field}</Badge>
                    <span className="text-xs text-muted-foreground">#{m.id}</span>
                  </div>
                  <div className="text-foreground">{m.text}</div>
                </li>
              ))}
              {missing.length > 200 && (
                <li className="p-3 text-xs text-muted-foreground text-center">
                  + {missing.length - 200} más…
                </li>
              )}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TranslationAudit;
