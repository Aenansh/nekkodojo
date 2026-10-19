"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BeltProgress } from "@/components/User/BeltCollection";
import { UserDetails } from "@/components/User/UserDetails";
import { ProfileActivityTabs } from "@/components/User/ProfileActivityTabs";
import DeleteProgress from "@/components/User/DeleteProgress";
import ProfileCharts from "@/components/User/ProfileCharts";

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
      <div className="min-h-screen bg-[#0f0b0a] text-[#a1887f] py-12 items-center justify-center">
        <div className="container mx-auto px-4 max-w-6xl">Loading profile...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f0b0a] text-[#eaddcf] py-12">
        <div className="container mx-auto px-4 max-w-6xl space-y-3">
          <p role="alert" className="text-red-400">
            {error ?? "Unable to load this profile."}
          </p>
          {error !== "User not found." && (
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="rounded-md border border-[#3e2723] px-4 py-2 text-sm hover:bg-[#1a110d]"
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
    <div className="min-h-screen bg-[#0f0b0a] text-[#eaddcf] py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-8 md:space-y-16">
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
    </div>
  );
}
