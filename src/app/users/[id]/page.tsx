"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, User } from "lucide-react";
import FollowButton from "@/components/FollowButton";

type Profile = {
    id: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
};

export default function UserProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const userId = params.id as string;

    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    const fetchUserProfile = async () => {
        // Fetch user profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('id, display_name, bio, avatar_url')
            .eq('id', userId)
            .maybeSingle();

        if (profileData) {
            setProfile(profileData);
        }

        // Fetch follower count
        const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        setFollowerCount(followersCount || 0);

        // Fetch following count
        const { count: followingsCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        setFollowingCount(followingsCount || 0);

        setLoading(false);
    };

    const handleFollowChange = () => {
        // Refresh follower count
        fetchUserProfile();
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
    }

    if (!profile) {
        return <div className="p-8 text-center text-gray-500">ユーザーが見つかりません</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => router.back()} className="mr-3">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">プロフィール</h1>
            </div>

            {/* Profile Content */}
            <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-gray-500" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{profile.display_name || "ゲスト"}</h1>
                            {profile.bio && (
                                <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>{followingCount} フォロー</span>
                                <span>{followerCount} フォロワー</span>
                            </div>
                        </div>
                    </div>
                    <FollowButton targetUserId={userId} onFollowChange={handleFollowChange} />
                </div>
            </div>
        </div>
    );
}
