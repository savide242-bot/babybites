import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, Baby, Calendar, Flame, Star, Trophy, 
  BookOpen, Utensils, Eye, Target, Camera, Pencil, Save, X, Loader2, Trash2
} from "lucide-react";
import { differenceInMonths, format } from "date-fns";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { useBabyProfiles, calculateMonthsFromBirthDate, getCategoryFromMonths } from "@/hooks/useBabyProfiles";
import { AddBabyModal } from "@/components/baby/AddBabyModal";
import { Plus, Check } from "lucide-react";

interface ProfileData {
  mother_name: string | null;
  baby_name: string | null;
  baby_birth_date: string | null;
  avatar_url: string | null;
  full_name: string;
}

interface Stats {
  recipesViewed: number;
  mealsLogged: number;
  currentStreak: number;
  totalPoints: number;
  badgesEarned: number;
  challengesCompleted: number;
  favoriteRecipes: number;
  daysActive: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { babies, activeBaby, selectBaby, deleteBaby } = useBabyProfiles();
  const [addBabyOpen, setAddBabyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    mother_name: "",
    baby_name: "",
    baby_birth_date: ""
  });

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const userId = session.user.id;

        // Fetch all data in parallel
        const [
          profileResult,
          recipesResult,
          mealsResult,
          streakResult,
          badgesResult,
          challengesResult,
          favoritesResult,
          sessionsResult
        ] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name, baby_birth_date, avatar_url, full_name').eq('id', userId).single(),
          supabase.from('recipe_views').select('id', { count: 'exact' }).eq('user_id', userId),
          supabase.from('meal_logs').select('id', { count: 'exact' }).eq('user_id', userId),
          supabase.from('user_streaks').select('current_streak, total_points').eq('user_id', userId).single(),
          supabase.from('user_badges').select('id', { count: 'exact' }).eq('user_id', userId),
          supabase.from('completed_challenges_history').select('id', { count: 'exact' }).eq('user_id', userId),
          supabase.from('favorite_recipes').select('id', { count: 'exact' }).eq('user_id', userId),
          supabase.from('user_sessions').select('total_sessions').eq('user_id', userId).single()
        ]);

        if (profileResult.data) {
          setProfile(profileResult.data);
          setEditForm({
            mother_name: profileResult.data.mother_name || "",
            baby_name: profileResult.data.baby_name || "",
            baby_birth_date: profileResult.data.baby_birth_date || ""
          });
        }

        setStats({
          recipesViewed: recipesResult.count || 0,
          mealsLogged: mealsResult.count || 0,
          currentStreak: streakResult.data?.current_streak || 0,
          totalPoints: streakResult.data?.total_points || 0,
          badgesEarned: badgesResult.count || 0,
          challengesCompleted: challengesResult.count || 0,
          favoriteRecipes: favoritesResult.count || 0,
          daysActive: sessionsResult.data?.total_sessions || 1
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndStats();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          mother_name: editForm.mother_name || null,
          baby_name: editForm.baby_name || null,
          baby_birth_date: editForm.baby_birth_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        mother_name: editForm.mother_name || null,
        baby_name: editForm.baby_name || null,
        baby_birth_date: editForm.baby_birth_date || null
      } : null);
      
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const getBabyAge = () => {
    if (!profile?.baby_birth_date) return null;
    const months = differenceInMonths(new Date(), new Date(profile.baby_birth_date));
    if (months < 1) return "Newborn";
    if (months === 1) return "1 month";
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return years === 1 ? "1 year" : `${years} years`;
    return `${years}y ${remainingMonths}m`;
  };

  const getInitials = () => {
    if (profile?.mother_name) {
      return profile.mother_name.slice(0, 2).toUpperCase();
    }
    if (profile?.full_name) {
      return profile.full_name.slice(0, 2).toUpperCase();
    }
    return "BB";
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or less");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Delete existing avatar if any
      await supabase.storage.from('avatars').remove([filePath]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to update avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      // List and remove all files in user's folder
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`);
        await supabase.storage.from('avatars').remove(filePaths);
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', userId);

      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      toast.success("Avatar removed");
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error("Failed to remove avatar");
    }
  };

  const statCards = [
    { icon: Flame, label: "Day Streak", value: stats?.currentStreak || 0, color: "text-accent", bg: "bg-accent/10" },
    { icon: Star, label: "Total Points", value: stats?.totalPoints || 0, color: "text-sunshine", bg: "bg-sunshine/20" },
    { icon: Trophy, label: "Badges", value: stats?.badgesEarned || 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Target, label: "Challenges", value: stats?.challengesCompleted || 0, color: "text-mint", bg: "bg-mint/10" },
    { icon: Eye, label: "Recipes Viewed", value: stats?.recipesViewed || 0, color: "text-secondary", bg: "bg-secondary/10" },
    { icon: Utensils, label: "Meals Logged", value: stats?.mealsLogged || 0, color: "text-peach-foreground", bg: "bg-peach/30" },
    { icon: BookOpen, label: "Favorites", value: stats?.favoriteRecipes || 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Calendar, label: "Days Active", value: stats?.daysActive || 0, color: "text-muted-foreground", bg: "bg-muted" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-2xl space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-background via-peach/5 to-background pb-24 lg:pb-8 w-full max-w-full overflow-x-hidden min-w-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with Avatar */}
      <motion.div 
        className="bg-gradient-to-br from-primary/20 via-peach/30 to-mint/20 pt-8 pb-12"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg cursor-pointer" onClick={handleAvatarClick}>
                {isUploadingAvatar ? (
                  <AvatarFallback className="bg-primary/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
              >
                <Camera className="h-4 w-4" />
              </Button>
              {profile?.avatar_url && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full shadow-md"
                  onClick={handleRemoveAvatar}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {profile?.mother_name || profile?.full_name || "Mom"}
            </h1>
            
            {profile?.baby_name && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-peach/50 text-foreground">
                  <Baby className="mr-1 h-3 w-3" />
                  {profile.baby_name}
                </Badge>
                {getBabyAge() && (
                  <Badge variant="outline" className="border-primary/30">
                    {getBabyAge()}
                  </Badge>
                )}
              </div>
            )}

            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="container max-w-2xl px-3 sm:px-4 -mt-6 pb-8 space-y-6 w-full max-w-full min-w-0">
        {/* Edit Profile Card */}
        {isEditing && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mother_name">Your Name</Label>
                <Input
                  id="mother_name"
                  value={editForm.mother_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, mother_name: e.target.value }))}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baby_name">Baby's Name</Label>
                <Input
                  id="baby_name"
                  value={editForm.baby_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, baby_name: e.target.value }))}
                  placeholder="Enter baby's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baby_birth_date">Baby's Birth Date</Label>
                <Input
                  id="baby_birth_date"
                  type="date"
                  value={editForm.baby_birth_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, baby_birth_date: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveProfile} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <GlassCard variant="warm" glow>
          <div className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Trophy className="h-5 w-5 text-gold" />
            Your Stats
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`${stat.bg} rounded-xl p-4 flex items-center gap-3 transition-transform hover:scale-[1.02]`}
              >
                <div className={`p-2 rounded-lg bg-background/80`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Multi-Baby Profile Management Card */}
        <Card className="border border-[#EBE8DF] shadow-md bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-[#FAF9F5] border-b border-[#EBE8DF]">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-serif font-bold text-gray-900">
                <Baby className="h-5 w-5 text-[#1E5E3A]" />
                Children & Babies ({babies.length})
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddBabyOpen(true)}
                className="gap-1.5 rounded-xl border-[#CCE0D2] bg-white text-[#1E5E3A] hover:bg-[#EAF5EE] text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Child
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Manage multiple children under one account. Switch active child to adapt meal plans and recipes.
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {babies.map((b) => {
              const months = calculateMonthsFromBirthDate(b.birthDate);
              const category = getCategoryFromMonths(months);
              const isActive = b.id === activeBaby?.id;

              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "bg-[#EAF5EE]/60 border-[#1E5E3A] shadow-xs"
                      : "bg-white border-[#EBE8DF] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#EAF5EE] text-2xl flex items-center justify-center border border-[#CCE0D2]">
                      {b.avatarEmoji || "👶"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{b.name}</h4>
                        {isActive && (
                          <Badge className="bg-[#1E5E3A] text-white border-none text-[10px] font-semibold px-2 py-0.5">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {months} {months === 1 ? "month" : "months"} ({category}) • Born: {b.birthDate ? format(new Date(b.birthDate), "MMM d, yyyy") : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectBaby(b.id)}
                        className="rounded-xl text-xs h-8 px-3 border-[#CCE0D2] text-[#1E5E3A] hover:bg-[#EAF5EE]"
                      >
                        Set Active
                      </Button>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    {babies.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteBaby(b.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg"
                        title="Remove child profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <AddBabyModal open={addBabyOpen} onOpenChange={setAddBabyOpen} />

        {/* Motivational Card */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-5 border border-primary/20 text-center">
          <p className="text-lg font-medium text-foreground">
            🌟 You're doing amazing!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
          {stats?.mealsLogged || 0} meals logged for {profile?.baby_name || "your baby"}'s healthy journey
        </p>
      </div>
    </div>
  </motion.div>
);
};

export default Profile;
