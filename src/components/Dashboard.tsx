"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, MoreHorizontal, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";

export type StudyRecord = {
    id: string;
    user_id: string;
    subject: string;
    duration: number;
    date: string;
    notes: string;
    created_at: string;
    material_image?: string | null;
    user_display_name?: string | null;
    user_avatar_url?: string | null;
};

export type Comment = {
    id: string;
    record_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user_email?: string;
};

export type Goal = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    date: string | null;
    created_at: string;
    user_display_name?: string | null;
    user_avatar_url?: string | null;
};

export type DashboardInitialData = {
    userEmail: string | null;
    currentUserId: string | null;
    followingIds: string[];
    records: StudyRecord[];
    comments: { [key: string]: Comment[] };
    goals: Goal[];
};

export default function Dashboard({
    readOnly = false,
    initialData,
}: {
    readOnly?: boolean;
    initialData?: DashboardInitialData;
}) {
    const [records, setRecords] = useState<StudyRecord[]>(initialData?.records ?? []);
    const [allRecords, setAllRecords] = useState<StudyRecord[]>(initialData?.records ?? []);
    const [goals, setGoals] = useState<Goal[]>(initialData?.goals ?? []);
    const [loading, setLoading] = useState(!initialData);
    const [userEmail, setUserEmail] = useState<string | null>(initialData?.userEmail ?? null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(initialData?.currentUserId ?? null);
    const [comments, setComments] = useState<{ [key: string]: Comment[] }>(initialData?.comments ?? {});
    const [showMenu, setShowMenu] = useState<{ [key: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<"follow" | "goals">("follow");
    const [followingIds, setFollowingIds] = useState<string[]>(initialData?.followingIds ?? []);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (initialData) {
            return;
        }

        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            setUserEmail(user.email || null);
            setCurrentUserId(user.id);

            const [
                { data: followsData },
                { data: recordsData },
                { data: commentsData },
                { data: goalsData },
            ] = await Promise.all([
                supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', user.id),
                supabase
                    .from('study_records')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50),
                supabase
                    .from('comments')
                    .select('*')
                    .order('created_at', { ascending: true })
                    .limit(500),
                supabase
                    .from('goals')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100),
            ]);

            const followingUserIds = followsData?.map(f => f.following_id) || [];
            setFollowingIds(followingUserIds);

            if (recordsData) {
                const materialNames = [...new Set(recordsData.map(r => r.subject))];
                const userIds = [...new Set(recordsData.map(r => r.user_id))];

                const [materialsRes, profilesRes] = await Promise.all([
                    materialNames.length
                        ? supabase
                            .from('materials')
                            .select('name, image')
                            .in('name', materialNames)
                        : Promise.resolve({ data: [] }),
                    userIds.length
                        ? supabase
                            .from('profiles')
                            .select('id, display_name, avatar_url')
                            .in('id', userIds)
                        : Promise.resolve({ data: [] }),
                ]);

                const materialImageMap = new Map(
                    (materialsRes.data as { name: string; image: string | null }[] | null)?.map(m => [m.name, m.image]) || []
                );
                const userNameMap = new Map(
                    (profilesRes.data as { id: string; display_name: string | null }[] | null)?.map(p => [p.id, p.display_name]) || []
                );
                const userAvatarMap = new Map(
                    (profilesRes.data as { id: string; avatar_url: string | null }[] | null)?.map(p => [p.id, p.avatar_url]) || []
                );

                const enrichedRecords = recordsData.map(record => ({
                    ...record,
                    material_image: materialImageMap.get(record.subject) || null,
                    user_display_name: userNameMap.get(record.user_id) || null,
                    user_avatar_url: userAvatarMap.get(record.user_id) || null
                }));

                setAllRecords(enrichedRecords);
                setRecords(enrichedRecords);

                if (commentsData) {
                    const commentsByRecord: { [key: string]: Comment[] } = {};
                    commentsData.forEach(comment => {
                        if (!commentsByRecord[comment.record_id]) {
                            commentsByRecord[comment.record_id] = [];
                        }
                        commentsByRecord[comment.record_id].push(comment);
                    });
                    setComments(commentsByRecord);
                }
            }

            if (goalsData && goalsData.length) {
                const goalUserIds = [...new Set(goalsData.map(g => g.user_id))];
                const { data: goalProfilesData } = goalUserIds.length
                    ? await supabase
                        .from('profiles')
                        .select('id, display_name, avatar_url')
                        .in('id', goalUserIds)
                    : { data: [] };

                const goalUserNameMap = new Map(
                    goalProfilesData?.map(p => [p.id, p.display_name]) || []
                );
                const goalUserAvatarMap = new Map(
                    goalProfilesData?.map(p => [p.id, p.avatar_url]) || []
                );

                const enrichedGoals = goalsData.map(goal => ({
                    ...goal,
                    user_display_name: goalUserNameMap.get(goal.user_id) || null,
                    user_avatar_url: goalUserAvatarMap.get(goal.user_id) || null
                }));

                setGoals(enrichedGoals);
            } else {
                setGoals([]);
            }

            setLoading(false);
        };
        fetchData();
    }, [initialData]);

    useEffect(() => {
        // Filter records based on active tab
        if (activeTab === "follow") {
            if (followingIds.length === 0) {
                // No followings yet -> show all records as recommendations
                setRecords(allRecords);
            } else {
                setRecords(allRecords.filter(record =>
                    followingIds.includes(record.user_id) || record.user_id === currentUserId
                ));
            }
        } else {
            setRecords(allRecords);
        }
    }, [activeTab, allRecords, followingIds, currentUserId]);

    const toggleMenu = (recordId: string) => {
        setShowMenu(prev => ({
            ...prev,
            [recordId]: !prev[recordId]
        }));
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (!confirm('この学習記録を削除しますか？')) {
            return;
        }

        const { error } = await supabase
            .from('study_records')
            .delete()
            .eq('id', recordId);

        if (error) {
            console.error('Error deleting record:', error);
            alert('記録の削除に失敗しました');
        } else {
            // Remove from state
            setRecords(prev => prev.filter(r => r.id !== recordId));
            setShowMenu(prev => ({ ...prev, [recordId]: false }));
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
    }

    return (
        <div className="h-full w-full bg-white overflow-y-auto">
            <div>
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("follow")}
                        className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
                            activeTab === "follow"
                                ? "text-blue-500 border-b-2 border-blue-500"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        フォロー
                    </button>
                    <button
                        onClick={() => setActiveTab("goals")}
                        className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
                            activeTab === "goals"
                                ? "text-blue-500 border-b-2 border-blue-500"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        目標
                    </button>
                </div>

                <div className="bg-white">
                    {activeTab === "goals" ? (
                        // Goals Timeline
                        goals.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p>まだ目標がありません。</p>
                                <p className="text-sm mt-2">目標を設定してみましょう！</p>
                            </div>
                        ) : (
                            goals.map((goal, index) => (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 ${index !== goals.length - 1 ? 'border-b border-gray-200' : ''}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <button
                                            onClick={() => router.push(`/users/${goal.user_id}`)}
                                            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                                        >
                                            {goal.user_avatar_url ? (
                                                <img src={goal.user_avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="text-gray-500" size={20} />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <button
                                                    onClick={() => router.push(`/users/${goal.user_id}`)}
                                                    className="font-bold text-sm text-gray-900 hover:underline"
                                                >
                                                    {goal.user_display_name || "ゲスト"}
                                                </button>
                                                <p className="text-xs text-gray-400">
                                                    {formatDistanceToNow(new Date(goal.created_at), { addSuffix: true, locale: ja })}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <h3 className="font-bold text-gray-900 mb-1">{goal.title}</h3>
                                                {goal.description && (
                                                    <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                                                )}
                                                {goal.date && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        目標日: {new Date(goal.date).toLocaleDateString('ja-JP')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )
                    ) : (
                        // Study Records Timeline
                        records.map((record, index) => (
                        <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 ${index !== records.length - 1 ? 'border-b border-gray-200' : ''}`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start space-x-3 flex-1">
                                    <button
                                        onClick={() => router.push(`/users/${record.user_id}`)}
                                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                                    >
                                        {record.user_avatar_url ? (
                                            <img src={record.user_avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-gray-500" size={20} />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => router.push(`/users/${record.user_id}`)}
                                                className="font-bold text-sm text-gray-900 hover:underline"
                                            >
                                                {record.user_display_name || "ゲスト"}
                                            </button>
                                            <p className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(record.created_at), { addSuffix: true, locale: ja })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {currentUserId === record.user_id && (
                                    <div className="relative ml-2">
                                        <button
                                            onClick={() => toggleMenu(record.id)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                        {showMenu[record.id] && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => toggleMenu(record.id)}
                                                />
                                                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-32 z-20">
                                                    <button
                                                        onClick={() => {
                                                            toggleMenu(record.id);
                                                            handleDeleteRecord(record.id);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        削除
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="pl-13">
                                <button
                                    onClick={() => router.push(`/records/${record.id}`)}
                                    className="w-full text-left bg-gray-50 p-4 rounded-lg flex items-start space-x-4 hover:bg-gray-100 transition-colors"
                                >
                                    {/* Material Image */}
                                    <div className="w-16 h-20 bg-blue-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {record.material_image ? (
                                            <img
                                                src={record.material_image}
                                                alt={record.subject}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-blue-500 font-bold text-xs">NO IMAGE</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm mb-1">{record.subject}</h3>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {Math.floor(record.duration / 60) > 0 ? `${Math.floor(record.duration / 60)}時間` : ""}
                                                {record.duration % 60}分
                                            </span>
                                        </div>
                                        {record.notes && (
                                            <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border border-gray-100">
                                                {record.notes}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center space-x-6 text-gray-500 text-sm pl-13 mt-3">
                                <button
                                    onClick={() => router.push(`/records/${record.id}`)}
                                    className="flex items-center space-x-1 hover:text-gray-800 transition-colors"
                                >
                                    <MessageSquare size={18} />
                                    <span>{comments[record.id]?.length || 0}</span>
                                </button>
                                <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                                    <ThumbsUp size={18} />
                                    <span>いいね！</span>
                                </button>
                            </div>
                        </motion.div>
                    )))}

                    {activeTab === "follow" && records.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p>まだ記録がありません。</p>
                            <p className="text-sm mt-2">「記録する」から学習を記録してみましょう！</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

