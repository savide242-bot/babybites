import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, MessageCircle, UserPlus, UserCheck, Send, 
  Baby, Sparkles, Film, Image as ImageIcon, CheckCircle2, Edit3 
} from "lucide-react";
import { toast } from "sonner";

export interface MotherProfileData {
  id: string;
  name: string;
  babyName: string;
  babyAge: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isCurrentUser?: boolean;
  posts: Array<{
    id: string;
    title: string;
    mediaUrl: string;
    mediaType?: "image" | "video";
    likesCount: number;
  }>;
}

interface MotherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MotherProfileData | null;
  onToggleFollow?: (profileId: string) => void;
  onOpenDM?: (profile: MotherProfileData) => void;
  onUpdateProfile?: (updated: Partial<MotherProfileData>) => void;
}

export const MotherProfileModal: React.FC<MotherProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onToggleFollow,
  onOpenDM,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [babyName, setBabyName] = useState(profile?.babyName || "");
  const [babyAge, setBabyAge] = useState(profile?.babyAge || "");
  const [bio, setBio] = useState(profile?.bio || "");

  if (!profile) return null;

  const handleSaveEdit = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        name,
        babyName,
        babyAge,
        bio,
      });
    }
    setIsEditing(false);
    toast.success("Profile updated successfully! ✨");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full rounded-[28px] p-0 overflow-hidden bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 text-stone-900 dark:text-stone-100">
        {/* Cover Banner */}
        <div className="h-28 bg-gradient-to-r from-[#1E5E3A] via-[#2F7E50] to-[#55B37B] relative p-4 flex items-end">
          <div className="absolute top-3 right-3 flex gap-2">
            {profile.isCurrentUser && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setName(profile.name);
                  setBabyName(profile.babyName);
                  setBabyAge(profile.babyAge);
                  setBio(profile.bio);
                  setIsEditing(true);
                }}
                className="rounded-full bg-white/90 hover:bg-white text-forest text-xs h-7 px-2.5 border-none shadow-sm gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-5 pt-0 pb-6 -mt-12">
          {/* Avatar & Follow button row */}
          <div className="flex items-end justify-between mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full p-1 bg-white shadow-md">
                <img
                  src={profile.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-[#1E5E3A] text-white rounded-full flex items-center justify-center text-[10px] border-2 border-white">
                👶
              </span>
            </div>

            <div className="flex gap-2 mb-1">
              {!profile.isCurrentUser ? (
                <>
                  <Button
                    size="sm"
                    variant={profile.isFollowing ? "outline" : "default"}
                    onClick={() => onToggleFollow && onToggleFollow(profile.id)}
                    className={`rounded-full text-xs h-8 px-4 font-semibold ${
                      profile.isFollowing
                        ? "border-[#EBE8DF] text-gray-700 hover:bg-gray-50"
                        : "bg-[#1E5E3A] hover:bg-[#16472c] text-white"
                    }`}
                  >
                    {profile.isFollowing ? (
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" /> Following
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5" /> Follow
                      </span>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      if (onOpenDM) onOpenDM(profile);
                    }}
                    className="rounded-full bg-[#EAF5EF] hover:bg-[#d6ecde] text-[#1E5E3A] text-xs h-8 px-3 font-semibold gap-1.5 border-none shadow-none"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Name & Baby badge */}
          {isEditing ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Your Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-[#E3DFD3] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">Baby's Name</label>
                  <Input
                    value={babyName}
                    onChange={(e) => setBabyName(e.target.value)}
                    className="rounded-xl border-[#E3DFD3] text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">Baby's Age</label>
                  <Input
                    value={babyAge}
                    onChange={(e) => setBabyAge(e.target.value)}
                    placeholder="e.g. 8 months"
                    className="rounded-xl border-[#E3DFD3] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Bio / Story</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="rounded-xl border-[#E3DFD3] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs px-4"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-gray-900">{profile.name}</h3>
                  <CheckCircle2 className="w-4 h-4 text-[#48B774]" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#1E5E3A] font-semibold">
                  <Baby className="w-3.5 h-3.5" />
                  <span>
                    Mom of {profile.babyName} • {profile.babyAge}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {profile.bio || "Dedicated mom exploring healthy baby weaning and sharing wholesome meal ideas with the BabyBites community! 🥑🥣"}
                </p>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-around py-3 my-4 bg-[#FAF9F5] rounded-2xl border border-[#EBE8DF]">
                <div className="text-center">
                  <span className="block text-sm font-bold text-gray-900">{profile.posts.length}</span>
                  <span className="text-[11px] text-gray-500 font-medium">Posts</span>
                </div>
                <div className="h-6 w-[1px] bg-gray-200" />
                <div className="text-center">
                  <span className="block text-sm font-bold text-gray-900">{profile.followersCount}</span>
                  <span className="text-[11px] text-gray-500 font-medium">Followers</span>
                </div>
                <div className="h-6 w-[1px] bg-gray-200" />
                <div className="text-center">
                  <span className="block text-sm font-bold text-gray-900">{profile.followingCount}</span>
                  <span className="text-[11px] text-gray-500 font-medium">Following</span>
                </div>
              </div>

              {/* Mother's Posts Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#1E5E3A]" />
                    Mom's Shared Moments
                  </span>
                </div>

                {profile.posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No posts shared yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto no-scrollbar rounded-xl">
                    {profile.posts.map((post) => (
                      <div
                        key={post.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group cursor-pointer"
                      >
                        {post.mediaType === "video" ? (
                          <div className="w-full h-full relative">
                            <video
                              src={post.mediaUrl}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                              <Film className="w-3 h-3" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                          <Heart className="w-3 h-3 fill-white" />
                          <span>{post.likesCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MotherProfileModal;
