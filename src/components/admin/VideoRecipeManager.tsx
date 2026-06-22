import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, Sparkles, Loader2, Play, Trash2, Eye, EyeOff, Bell,
  Film, Image as ImageIcon, Save, Pencil, X,
} from 'lucide-react';

interface VideoRecipeRow {
  id: string;
  title: string;
  short_title: string;
  description: string;
  age_label: string;
  min_age_months: number;
  prep_time: string;
  cook_time: string;
  total_time: string;
  servings: string;
  difficulty: string;
  video_url: string;
  poster_url: string;
  video_duration: string;
  ingredients: string[];
  steps: string[];
  storage: string;
  expert_tip: string;
  nutrition_highlights: string[];
  allergen_note: string | null;
  published: boolean;
  views_count: number;
  sort_order: number;
  created_at: string;
}

const emptyDraft = {
  title: '', shortTitle: '', description: '',
  ageLabel: '6 months+', minAgeMonths: 6,
  prepTime: '10 min', cookTime: '15 min', totalTime: '25 min',
  servings: '', difficulty: 'Easy',
  videoDuration: '0:30',
  ingredients: [] as string[],
  steps: [] as string[],
  storage: '',
  expertTip: '',
  nutritionHighlights: [] as string[],
  allergenNote: null as string | null,
};

const MAX_VIDEO_MB = 45;

// Extract N candidate frames evenly spaced through the video (skipping the very first/last seconds
// which are usually black/intro/outro). Returns both compact data URLs (for AI) and full-resolution blobs.
const extractCandidateFrames = (
  videoFile: File,
  count = 6,
): Promise<{ dataUrls: string[]; blobs: Blob[] }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    const dataUrls: string[] = [];
    const blobs: Blob[] = [];
    let timestamps: number[] = [];
    let i = 0;

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.onloadedmetadata = () => {
      const dur = video.duration || 1;
      const start = Math.min(1.5, dur * 0.1);
      const end = Math.max(dur - 1.0, dur * 0.92);
      const span = Math.max(end - start, 0.5);
      timestamps = Array.from({ length: count }, (_, k) => start + (span * k) / (count - 1));
      video.currentTime = timestamps[0];
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas error'));
      ctx.drawImage(video, 0, 0);

      // Full quality blob (for upload)
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Frame blob failed'));
        blobs.push(blob);

        // Compact thumbnail for AI (max 512px wide)
        const scale = Math.min(1, 512 / canvas.width);
        const thumb = document.createElement('canvas');
        thumb.width = Math.round(canvas.width * scale);
        thumb.height = Math.round(canvas.height * scale);
        thumb.getContext('2d')!.drawImage(canvas, 0, 0, thumb.width, thumb.height);
        dataUrls.push(thumb.toDataURL('image/jpeg', 0.75));

        i++;
        if (i < timestamps.length) {
          video.currentTime = timestamps[i];
        } else {
          cleanup();
          resolve({ dataUrls, blobs });
        }
      }, 'image/jpeg', 0.9);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Video load failed — file may use an unsupported codec (try MP4/H.264).'));
    };
  });
};

const slugify = (text: string) =>
  'video-' +
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) +
  '-' + Date.now().toString(36);

const VideoRecipeManager = () => {
  const { toast } = useToast();
  const [list, setList] = useState<VideoRecipeRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [draftReady, setDraftReady] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadList = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('video_recipes')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    } else {
      setList((data || []) as VideoRecipeRow[]);
    }
    setLoadingList(false);
  };

  useEffect(() => { loadList(); }, []);

  const resetForm = () => {
    setVideoFile(null);
    setCaption('');
    setDraft(emptyDraft);
    setDraftReady(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.mov') || file.type === 'video/quicktime') {
      toast({
        title: '⚠️ .MOV not supported',
        description: 'iPhone .mov / HEVC files won\'t play on Android & Chrome. Convert to MP4 first (freeconvert.com).',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_VIDEO_MB) {
      toast({
        title: 'Video too large',
        description: `Max ${MAX_VIDEO_MB}MB. Your video is ${sizeMB.toFixed(1)}MB. Compress it first (try a free tool like clideo.com/compress-video).`,
        variant: 'destructive',
      });
      return;
    }
    setVideoFile(file);
  };

  const handleOrganize = async () => {
    if (!caption.trim()) {
      toast({ title: 'Caption required', description: 'Paste a rough description first', variant: 'destructive' });
      return;
    }
    setOrganizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('organize-video-recipe', {
        body: { caption },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const r = data.recipe;
      setDraft({
        title: r.title || '',
        shortTitle: r.shortTitle || r.title?.slice(0, 25) || '',
        description: r.description || '',
        ageLabel: r.ageLabel || '6 months+',
        minAgeMonths: r.minAgeMonths || 6,
        prepTime: r.prepTime || '10 min',
        cookTime: r.cookTime || '15 min',
        totalTime: r.totalTime || '25 min',
        servings: r.servings || '',
        difficulty: r.difficulty || 'Easy',
        videoDuration: r.videoDuration || '0:30',
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: Array.isArray(r.steps) ? r.steps : [],
        storage: r.storage || '',
        expertTip: r.expertTip || '',
        nutritionHighlights: Array.isArray(r.nutritionHighlights) ? r.nutritionHighlights : [],
        allergenNote: r.allergenNote || null,
      });
      setDraftReady(true);
      toast({ title: '✨ Caption organized', description: 'Review the structured recipe below, then publish.' });
    } catch (err: any) {
      toast({ title: 'AI organize failed', description: err.message, variant: 'destructive' });
    } finally {
      setOrganizing(false);
    }
  };

  const handlePublish = async () => {
    if (!editingId && !videoFile) {
      toast({ title: 'Video required', description: 'Select a video file first', variant: 'destructive' });
      return;
    }
    if (!draft.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const recipeId = editingId || slugify(draft.title);
      let videoUrl = '';
      let posterUrl = '';

      if (videoFile) {
        setUploadProgress(5);
        const ext = (videoFile.name.split('.').pop() || 'mp4').toLowerCase();
        const videoPath = `videos/${recipeId}.${ext}`;

        // 1. Extract 6 candidate frames from the video
        toast({ title: '🎬 Analyzing frames…', description: 'Picking the most attractive cover.' });
        const { dataUrls, blobs } = await extractCandidateFrames(videoFile, 6);
        setUploadProgress(20);

        // 2. Ask AI to pick the best one (fallback to middle frame on failure)
        let bestIndex = Math.floor(blobs.length / 2);
        try {
          const { data: pickData, error: pickErr } = await supabase.functions.invoke('pick-best-poster', {
            body: { frames: dataUrls },
          });
          if (!pickErr && pickData && typeof pickData.bestIndex === 'number') {
            bestIndex = pickData.bestIndex;
          }
        } catch (e) {
          console.warn('AI poster pick failed, using middle frame', e);
        }
        const posterBlob = blobs[bestIndex];
        setUploadProgress(35);

        // 3. Upload video
        const { error: vErr } = await supabase.storage
          .from('recipe-images')
          .upload(videoPath, videoFile, { upsert: true, contentType: videoFile.type || 'video/mp4' });
        if (vErr) throw vErr;
        setUploadProgress(75);

        // 4. Upload chosen poster
        const posterPath = `videos/${recipeId}-poster.jpg`;
        const { error: pErr } = await supabase.storage
          .from('recipe-images')
          .upload(posterPath, posterBlob, { upsert: true, contentType: 'image/jpeg' });
        if (pErr) throw pErr;
        setUploadProgress(90);

        videoUrl = supabase.storage.from('recipe-images').getPublicUrl(videoPath).data.publicUrl;
        posterUrl = supabase.storage.from('recipe-images').getPublicUrl(posterPath).data.publicUrl;
      }

      const row: any = {
        id: recipeId,
        title: draft.title,
        short_title: draft.shortTitle || draft.title.slice(0, 25),
        description: draft.description,
        age_label: draft.ageLabel,
        min_age_months: draft.minAgeMonths,
        prep_time: draft.prepTime,
        cook_time: draft.cookTime,
        total_time: draft.totalTime,
        servings: draft.servings,
        difficulty: draft.difficulty,
        video_duration: draft.videoDuration,
        ingredients: draft.ingredients,
        steps: draft.steps,
        storage: draft.storage,
        expert_tip: draft.expertTip,
        nutrition_highlights: draft.nutritionHighlights,
        allergen_note: draft.allergenNote,
        published: true,
        created_by: user.id,
      };
      if (videoUrl) row.video_url = videoUrl;
      if (posterUrl) row.poster_url = posterUrl;

      const { error: dbErr } = editingId
        ? await supabase.from('video_recipes').update(row).eq('id', editingId)
        : await supabase.from('video_recipes').insert(row);
      if (dbErr) throw dbErr;
      setUploadProgress(100);

      if (notifyUsers && !editingId) {
        try {
          await supabase.functions.invoke('notify-all-users', {
            body: {
              title: '🎬 New Video Recipe!',
              body: `${draft.title} — tap to watch & cook step by step.`,
            },
          });
        } catch (e) {
          console.error('Notify failed:', e);
        }
      }

      toast({ title: editingId ? '✅ Updated' : '✅ Published', description: 'Live for all users now.' });
      resetForm();
      loadList();
    } catch (err: any) {
      toast({ title: 'Publish failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video recipe permanently?')) return;
    const { error } = await supabase.from('video_recipes').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Deleted' });
      loadList();
    }
  };

  const togglePublished = async (row: VideoRecipeRow) => {
    const { error } = await supabase
      .from('video_recipes')
      .update({ published: !row.published })
      .eq('id', row.id);
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    else loadList();
  };

  const startEdit = (row: VideoRecipeRow) => {
    setEditingId(row.id);
    setDraft({
      title: row.title,
      shortTitle: row.short_title,
      description: row.description,
      ageLabel: row.age_label,
      minAgeMonths: row.min_age_months,
      prepTime: row.prep_time,
      cookTime: row.cook_time,
      totalTime: row.total_time,
      servings: row.servings,
      difficulty: row.difficulty,
      videoDuration: row.video_duration,
      ingredients: row.ingredients || [],
      steps: row.steps || [],
      storage: row.storage,
      expertTip: row.expert_tip,
      nutritionHighlights: row.nutrition_highlights || [],
      allergenNote: row.allergen_note,
    });
    setDraftReady(true);
    setVideoFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-gold" />
            {editingId ? 'Edit Video Recipe' : 'Upload New Video Recipe'}
          </CardTitle>
          <CardDescription>
            {editingId
              ? 'Update fields below. Re-uploading the video is optional.'
              : `Upload a video (max ${MAX_VIDEO_MB}MB), paste the rough caption, let AI organize it, then publish.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Video picker */}
          <div className="space-y-2">
            <Label>Video file {editingId && <span className="text-xs text-muted-foreground">(optional — keeps existing if empty)</span>}</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoSelect}
                disabled={uploading}
              />
              {videoFile && (
                <Badge variant="secondary" className="self-start text-xs">
                  {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              📱 <strong>MP4 (H.264) only</strong> — max {MAX_VIDEO_MB}MB. iPhone <code>.mov</code> / HEVC won't play on Android. Convert first at <a href="https://www.freeconvert.com/mov-to-mp4" target="_blank" rel="noopener" className="underline">freeconvert.com</a>. AI picks the best frame as cover.
            </p>
          </div>

          {/* Caption + AI organize */}
          <div className="space-y-2">
            <Label>Rough caption / description</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Paste the TikTok/Instagram caption or any rough text — AI will turn it into a structured recipe."
              rows={5}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleOrganize}
              disabled={organizing || !caption.trim() || uploading}
              className="w-full sm:w-auto"
            >
              {organizing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Organizing…</> : <><Sparkles className="mr-2 h-4 w-4" /> ✨ Organize with AI</>}
            </Button>
          </div>

          {/* Editable draft */}
          {draftReady && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Review & edit before publishing</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
                <Field label="Short title" value={draft.shortTitle} onChange={(v) => setDraft({ ...draft, shortTitle: v })} />
                <Field label="Age label" value={draft.ageLabel} onChange={(v) => setDraft({ ...draft, ageLabel: v })} />
                <Field label="Min age (months)" type="number" value={String(draft.minAgeMonths)} onChange={(v) => setDraft({ ...draft, minAgeMonths: parseInt(v) || 6 })} />
                <Field label="Prep time" value={draft.prepTime} onChange={(v) => setDraft({ ...draft, prepTime: v })} />
                <Field label="Cook time" value={draft.cookTime} onChange={(v) => setDraft({ ...draft, cookTime: v })} />
                <Field label="Total time" value={draft.totalTime} onChange={(v) => setDraft({ ...draft, totalTime: v })} />
                <Field label="Servings" value={draft.servings} onChange={(v) => setDraft({ ...draft, servings: v })} />
                <Field label="Difficulty" value={draft.difficulty} onChange={(v) => setDraft({ ...draft, difficulty: v })} />
                <Field label="Video duration" value={draft.videoDuration} onChange={(v) => setDraft({ ...draft, videoDuration: v })} />
              </div>
              <TextField label="Description" value={draft.description} rows={3} onChange={(v) => setDraft({ ...draft, description: v })} />
              <ListField label="Ingredients (one per line)" value={draft.ingredients} onChange={(v) => setDraft({ ...draft, ingredients: v })} />
              <ListField label="Steps (one per line)" value={draft.steps} onChange={(v) => setDraft({ ...draft, steps: v })} rows={8} />
              <ListField label="Nutrition highlights (one per line)" value={draft.nutritionHighlights} onChange={(v) => setDraft({ ...draft, nutritionHighlights: v })} rows={3} />
              <TextField label="Storage" value={draft.storage} rows={2} onChange={(v) => setDraft({ ...draft, storage: v })} />
              <TextField label="Expert tip" value={draft.expertTip} rows={2} onChange={(v) => setDraft({ ...draft, expertTip: v })} />
              <TextField label="Allergen note (optional)" value={draft.allergenNote || ''} rows={2} onChange={(v) => setDraft({ ...draft, allergenNote: v || null })} />

              {!editingId && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="notify" className="cursor-pointer text-sm">Notify all users on publish</Label>
                  </div>
                  <Switch id="notify" checked={notifyUsers} onCheckedChange={setNotifyUsers} />
                </div>
              )}

              {uploading && (
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{uploadProgress}% — uploading…</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handlePublish} disabled={uploading} className="flex-1">
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</> : <><Save className="mr-2 h-4 w-4" /> {editingId ? 'Save Changes' : 'Publish Video Recipe'}</>}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={uploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Published Video Recipes ({list.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No video recipes yet.</p>
          ) : (
            <div className="space-y-2">
              {list.map((row) => (
                <div key={row.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <img src={row.poster_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm truncate">{row.title}</h4>
                      <Badge variant="secondary" className="text-[10px]">{row.age_label}</Badge>
                      {!row.published && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Eye className="inline h-3 w-3 mr-1" />{row.views_count} views · {row.total_time}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => togglePublished(row)} title={row.published ? 'Hide' : 'Show'}>
                      {row.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(row)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)} title="Delete" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const TextField = ({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} />
  </div>
);

const ListField = ({ label, value, onChange, rows = 5 }: { label: string; value: string[]; onChange: (v: string[]) => void; rows?: number }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Textarea
      value={value.join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
      rows={rows}
    />
  </div>
);

export default VideoRecipeManager;
