"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BeltProgress } from "@/components/User/BeltCollection";
import { UserDetails } from "@/components/User/UserDetails";
import { ProfileActivityTabs } from "@/components/User/ProfileActivityTabs";
import DeleteProgress from "@/components/User/DeleteProgress";
import ProfileCharts from "@/components/User/ProfileCharts";
import { Loader2 } from "lucide-react";

type ProfileData = {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    profileUrl: string | null;
    email: string;
    createdAt: string;
    socialLinks: { id: string; platform: string; platformUrl: string }[];
    beltRank: string;
  };
  stats: {
    solved: number;
    discussions: number;
    comments: number;
    reputation: number;
  };
  isOwnProfile: boolean;
  totalSolved: number;
  difficultyStats: { name: string; value: number; color: string }[];
  categoryStats: { name: string; total: number; solved: number }[];
  companyStats: { id: string; name: string; logo: string; total: number; solved: number }[];
  activityData: { date: string; count: number }[];
  solvedQuestions: {
    id: string;
    updatedAt: string;
    question: {
      id: string;
      slug: string;
      title: string;
      difficulty: string;
      externalPlatformUrl: string;
    };
  }[];
  discussions: {
    id: string;
    title: string;
    createdAt: string;
    likeCount: number;
    dislikeCount: number;
    _count: { comments: number };
  }[];
  comments: {
    id: string;
    description: string;
    createdAt: string;
    discussion: { id: string; title: string };
  }[];
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${encodeURIComponent(username)}`);
        if (response.status === 404) {
          if (!cancelled) setError("User not found.");
          return;
        }
        if (!response.ok) throw new Error("Failed to load profile.");

        const profile = (await response.json()) as ProfileData;
        if (!cancelled) setData(profile);
      } catch (fetchError) {
        console.error("Failed to load profile:", fetchError);
        if (!cancelled) setError("Unable to load this profile. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [username, retryCount]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0b0a] py-12 text-[#d4af37]">
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span>Loading profile…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f0b0a] py-12 text-[#eaddcf]">
        <div className="container mx-auto max-w-5xl space-y-4 px-5 md:px-8">
          <p role="alert" className="text-[#d4796b]">
            {error ?? "Unable to load this profile."}
          </p>
          {error !== "User not found." && (
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="rounded-full border border-[#3e2723] px-5 py-2 text-sm transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const user = { ...data.user, createdAt: new Date(data.user.createdAt) };
  const solvedQuestions = data.solvedQuestions.map((item) => ({
    ...item,
    updatedAt: new Date(item.updatedAt),
  }));
  const discussions = data.discussions.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
  }));
  const comments = data.comments.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
  }));

  return (
    <main className="min-h-screen py-10 text-[#eaddcf] md:py-16">
      <div className="container mx-auto max-w-5xl space-y-16 px-5 md:space-y-24 md:px-8">
        <UserDetails user={user} stats={data.stats} isOwnProfile={data.isOwnProfile} />
        <BeltProgress totalSolved={data.totalSolved} />
        <ProfileCharts
          difficultyStats={data.difficultyStats}
          categoryStats={data.categoryStats}
          totalSolved={data.totalSolved}
          companyStats={data.companyStats}
          activityData={data.activityData}
          isCurrentUser={data.isOwnProfile}
        />
        <ProfileActivityTabs
          solvedQuestions={solvedQuestions}
          discussions={discussions}
          comments={comments}
        />
        {data.isOwnProfile && <DeleteProgress />}
      </div>
    </main>
  );
}
