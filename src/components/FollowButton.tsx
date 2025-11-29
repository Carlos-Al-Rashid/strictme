"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type FollowButtonProps = {
    targetUserId: string;
    onFollowChange?: () => void;
};

export default function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        checkFollowStatus();
    }, [targetUserId]);

    const checkFollowStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        setCurrentUserId(user.id);

        // Don't show button if viewing own profile
        if (user.id === targetUserId) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
            .maybeSingle();

        setIsFollowing(!!data);
        setLoading(false);
    };

    const handleFollow = async () => {
        if (!currentUserId) {
            alert('ログインが必要です');
            return;
        }

        setLoading(true);

        if (isFollowing) {
            // Unfollow
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUserId)
                .eq('following_id', targetUserId);

            if (error) {
                console.error('Error unfollowing:', error);
                alert('フォロー解除に失敗しました');
            } else {
                setIsFollowing(false);
                onFollowChange?.();
            }
        } else {
            // Follow
            const { error } = await supabase
                .from('follows')
                .insert([{
                    follower_id: currentUserId,
                    following_id: targetUserId
                }]);

            if (error) {
                console.error('Error following:', error);
                alert('フォローに失敗しました');
            } else {
                setIsFollowing(true);
                onFollowChange?.();
            }
        }

        setLoading(false);
    };

    // Don't show button if viewing own profile
    if (currentUserId === targetUserId) {
        return null;
    }

    if (loading && currentUserId === null) {
        return null;
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
            {isFollowing ? 'フォロー中' : 'フォロー'}
        </button>
    );
}
