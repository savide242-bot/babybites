import { supabase } from "@/integrations/supabase/client";

export interface CommunityReport {
  id: string;
  post_id: string;
  post_title: string;
  post_author: string;
  post_author_baby?: string;
  post_media_url?: string;
  post_media_type?: "image" | "video";
  reporter_name: string;
  reporter_id: string;
  reason: string;
  details?: string;
  created_at: string;
  status: "pending" | "resolved" | "dismissed";
}

export const COMMUNITY_LOCAL_POSTS_KEY = "babybites_community_local_posts_v3";
export const COMMUNITY_DELETED_POSTS_KEY = "babybites_community_deleted_ids_v1";
export const COMMUNITY_REPORTS_KEY = "babybites_community_reports_v1";
export const COMMUNITY_VIEWED_STORIES_KEY = "babybites_viewed_stories_v1";

// 1. Deleted Post Management
export const getDeletedPostIds = (): string[] => {
  try {
    const saved = localStorage.getItem(COMMUNITY_DELETED_POSTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Error reading deleted post ids:", e);
    return [];
  }
};

export const isPostDeleted = (postId: string): boolean => {
  const deleted = getDeletedPostIds();
  return deleted.includes(postId);
};

export const deletePostGlobally = async (postId: string): Promise<boolean> => {
  try {
    // 1. Add to deleted IDs in localStorage
    const currentDeleted = getDeletedPostIds();
    if (!currentDeleted.includes(postId)) {
      const updatedDeleted = [...currentDeleted, postId];
      localStorage.setItem(COMMUNITY_DELETED_POSTS_KEY, JSON.stringify(updatedDeleted));
    }

    // 2. Remove from local posts cache
    try {
      const localSaved = localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
      if (localSaved) {
        const posts = JSON.parse(localSaved);
        const filtered = posts.filter((p: any) => p.id !== postId);
        localStorage.setItem(COMMUNITY_LOCAL_POSTS_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error("Error removing from local posts:", e);
    }

    // 3. Delete from Supabase if not a mock/sample
    if (!postId.startsWith("sample-")) {
      try {
        await supabase.from("forum_posts").delete().eq("id", postId);
      } catch (err) {
        console.warn("Supabase delete failed or table not found:", err);
      }
    }

    // 4. Dispatch custom window event for instant multi-component reactivity
    window.dispatchEvent(
      new CustomEvent("babygram:post_deleted", { detail: { postId } })
    );

    return true;
  } catch (error) {
    console.error("Failed to delete post:", error);
    return false;
  }
};

// 2. Community Reports Management
export const getCommunityReports = (): CommunityReport[] => {
  try {
    const saved = localStorage.getItem(COMMUNITY_REPORTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading reports:", e);
  }
  return [];
};

export const reportPost = async (reportData: {
  post_id: string;
  post_title: string;
  post_author: string;
  post_author_baby?: string;
  post_media_url?: string;
  post_media_type?: "image" | "video";
  reporter_name: string;
  reporter_id: string;
  reason: string;
  details?: string;
}): Promise<CommunityReport> => {
  const newReport: CommunityReport = {
    id: "rep-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
    ...reportData,
    created_at: new Date().toISOString(),
    status: "pending",
  };

  try {
    const existing = getCommunityReports();
    const updated = [newReport, ...existing];
    localStorage.setItem(COMMUNITY_REPORTS_KEY, JSON.stringify(updated));

    // Try storing in Supabase if a reports table is present
    try {
      await (supabase as any).from("community_reports").insert([
        {
          post_id: reportData.post_id,
          reporter_name: reportData.reporter_name,
          reason: reportData.reason,
          details: reportData.details || null,
        },
      ]);
    } catch {
      // Ignored if table does not exist
    }

    window.dispatchEvent(
      new CustomEvent("babygram:post_reported", { detail: { report: newReport } })
    );
  } catch (e) {
    console.error("Error saving report:", e);
  }

  return newReport;
};

export const dismissReport = (reportId: string): void => {
  try {
    const existing = getCommunityReports();
    const updated = existing.map((r) =>
      r.id === reportId ? { ...r, status: "dismissed" as const } : r
    );
    localStorage.setItem(COMMUNITY_REPORTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("babygram:reports_updated"));
  } catch (e) {
    console.error("Error dismissing report:", e);
  }
};

export const deleteReportedPost = async (
  reportId: string,
  postId: string
): Promise<void> => {
  await deletePostGlobally(postId);
  try {
    const existing = getCommunityReports();
    const updated = existing.map((r) =>
      r.id === reportId ? { ...r, status: "resolved" as const } : r
    );
    localStorage.setItem(COMMUNITY_REPORTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("babygram:reports_updated"));
  } catch (e) {
    console.error("Error resolving report:", e);
  }
};

// 3. Viewed Stories Management
export const getViewedStoryIds = (): string[] => {
  try {
    const saved = localStorage.getItem(COMMUNITY_VIEWED_STORIES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const markStoryAsViewed = (storyId: string): void => {
  try {
    const viewed = getViewedStoryIds();
    if (!viewed.includes(storyId)) {
      const updated = [...viewed, storyId];
      localStorage.setItem(COMMUNITY_VIEWED_STORIES_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent("babygram:story_viewed", { detail: { storyId } })
      );
    }
  } catch (e) {
    console.error("Error marking story as viewed:", e);
  }
};
