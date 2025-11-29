"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MoreHorizontal, User, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

type Achievement = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    achievement_date: string;
    created_at: string;
    user_email?: string;
};

export default function AchievementReportPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [achievementDate, setAchievementDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('created_at', { ascending: false });

        if (data && !error) {
            setAchievements(data);
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert("達成内容を入力してください");
            return;
        }

        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("ログインが必要です");
            setSubmitting(false);
            return;
        }

        const { data, error } = await supabase
            .from('achievements')
            .insert([
                {
                    user_id: user.id,
                    title: title.trim(),
                    description: description.trim() || null,
                    achievement_date: achievementDate
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating achievement:', error);
            alert('達成報告の投稿に失敗しました');
        } else if (data) {
            setAchievements([{ ...data, user_email: user.email || undefined }, ...achievements]);
            setTitle("");
            setDescription("");
            setAchievementDate(format(new Date(), "yyyy-MM-dd"));
            setShowAddForm(false);
        }

        setSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-900">達成報告</h1>
            </div>

            {/* Tab */}
            <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">みんなの報告</span>
                    <select className="text-sm text-gray-700 border-none focus:outline-none">
                        <option>みんな</option>
                    </select>
                </div>
            </div>

            {/* Achievements List */}
            <div className="max-w-3xl mx-auto py-4 px-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">読み込み中...</div>
                ) : (
                    <div className="space-y-4">
                        {achievements.map((achievement) => (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <User className="text-gray-500" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-gray-900 mb-1">
                                                {achievement.user_email?.split('@')[0] || "ユーザー"}
                                            </p>
                                            <div className="bg-pink-50 border border-pink-200 rounded px-2 py-1 mb-2 inline-flex items-center gap-1">
                                                <Award size={14} className="text-pink-600" />
                                                <span className="text-xs font-bold text-pink-600">{achievement.title}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                {format(new Date(achievement.achievement_date), "yyyy年M月d日")}
                                            </p>
                                            {achievement.description && (
                                                <p className="text-sm text-gray-700">{achievement.description}</p>
                                            )}
                                            <div className="flex items-center gap-1 mt-2 text-gray-400">
                                                <Award size={14} />
                                                <span className="text-xs">おめでとう！</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs text-gray-400">
                                            {format(new Date(achievement.created_at), "HH:mm")}
                                        </span>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {achievements.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <p>まだ達成報告がありません。</p>
                                <p className="text-sm mt-2">下のボタンから達成を報告してみましょう！</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-20">
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors font-bold text-sm"
                >
                    達成を報告
                </button>
            </div>

            {/* Add Achievement Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
                        onClick={() => !submitting && setShowAddForm(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30 }}
                            className="bg-white w-full md:max-w-lg md:rounded-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900">達成を報告</h2>
                                <button
                                    onClick={() => !submitting && setShowAddForm(false)}
                                    className="text-gray-600 hover:text-gray-900"
                                    disabled={submitting}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        達成内容 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="例: 英検準1級 合格"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        達成日
                                    </label>
                                    <input
                                        type="date"
                                        value={achievementDate}
                                        onChange={(e) => setAchievementDate(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        詳細（任意）
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="例: 前回落ちた分がんばったよ！！"
                                        rows={3}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                    disabled={submitting}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!title.trim() || submitting}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? '投稿中...' : '投稿'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
