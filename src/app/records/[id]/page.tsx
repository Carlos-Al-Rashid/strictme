"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, MessageSquare, ThumbsUp, User, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

type StudyRecord = {
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

type Comment = {
    id: string;
    record_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user_email?: string;
};

export default function RecordDetailPage() {
    const [record, setRecord] = useState<StudyRecord | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const recordId = params.id as string;

    useEffect(() => {
        fetchRecordDetail();
    }, [recordId]);

    const fetchRecordDetail = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserEmail(user.email || null);
            setCurrentUserId(user.id);
        }

        // Fetch the specific record
        const { data: recordData } = await supabase
            .from('study_records')
            .select('*')
            .eq('id', recordId)
            .single();

        if (recordData) {
            // Fetch material image from global materials (not user-specific)
            const { data: materialsData } = await supabase
                .from('materials')
                .select('name, image')
                .eq('name', recordData.subject)
                .maybeSingle();

            // Fetch user profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', recordData.user_id)
                .maybeSingle();

            setRecord({
                ...recordData,
                material_image: materialsData?.image || null,
                user_display_name: profileData?.display_name || null,
                user_avatar_url: profileData?.avatar_url || null
            });

            // Fetch comments for this record
            const { data: commentsData } = await supabase
                .from('comments')
                .select('*')
                .eq('record_id', recordId)
                .order('created_at', { ascending: true });

            if (commentsData) {
                setComments(commentsData);
            }
        }

        setLoading(false);
    };

    const handleCommentSubmit = async () => {
        const content = commentText.trim();
        if (!content) return;

        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('コメントを投稿するにはログインが必要です');
            setSubmitting(false);
            return;
        }

        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    record_id: recordId,
                    user_id: user.id,
                    content: content
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error submitting comment:', error);
            alert('コメントの投稿に失敗しました');
        } else if (data) {
            setComments([...comments, { ...data, user_email: user.email || undefined }]);
            setCommentText('');
        }

        setSubmitting(false);
    };

    const handleDeleteRecord = async () => {
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
            router.push('/');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
    }

    if (!record) {
        return <div className="p-8 text-center text-gray-500">記録が見つかりません</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="mr-3">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{record.subject}</h1>
                </div>
                {currentUserId === record.user_id && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <MoreHorizontal size={20} />
                        </button>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-32 z-20">
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            handleDeleteRecord();
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
            <div className="bg-white mt-4">
                {/* User Info */}
                <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => router.push(`/users/${record.user_id}`)}
                                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
                            >
                                {record.user_avatar_url ? (
                                    <img src={record.user_avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="text-gray-500" size={20} />
                                )}
                            </button>
                            <div>
                                <button
                                    onClick={() => router.push(`/users/${record.user_id}`)}
                                    className="font-bold text-sm text-gray-900 hover:underline"
                                >
                                    {record.user_display_name || "ゲスト"}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(record.created_at), { addSuffix: true, locale: ja })}
                        </p>
                    </div>
                </div>

                {/* Record Content */}
                <div className="px-4 py-6">
                    <div className="bg-gray-50 p-4 rounded-lg flex items-start space-x-4">
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
                    </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center space-x-6 text-gray-500 text-sm">
                    <button className="flex items-center space-x-2 hover:text-gray-800 transition-colors">
                        <MessageSquare size={18} />
                        <span>コメント</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                        <ThumbsUp size={18} />
                        <span>いいね！</span>
                    </button>
                </div>

                {/* Comments Section */}
                {comments.length > 0 && (
                    <div className="px-4 py-4 border-t border-gray-100">
                        <h3 className="font-bold text-sm text-gray-700 mb-3">コメント</h3>
                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <User className="text-gray-500" size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="font-bold text-xs text-gray-700 mb-1">
                                                {comment.user_email?.split('@')[0] || 'ユーザー'}
                                            </p>
                                            <p className="text-sm text-gray-800">{comment.content}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 ml-3">
                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ja })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comment Input */}
                <div className="px-4 py-4 border-t border-gray-100">
                    <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <User className="text-gray-500" size={16} />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !submitting) {
                                        handleCommentSubmit();
                                    }
                                }}
                                placeholder="コメントを入力"
                                className="w-full p-3 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                        <button
                            onClick={handleCommentSubmit}
                            disabled={!commentText.trim() || submitting}
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? '投稿中...' : '投稿'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
