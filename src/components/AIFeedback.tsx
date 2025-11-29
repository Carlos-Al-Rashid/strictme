"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function AIFeedback() {
    const [feedback, setFeedback] = useState<string>("学習状況を分析中...");
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                // Fetch all user data from Supabase
                const { data: records } = await supabase
                    .from('study_records')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                const { data: materials } = await supabase
                    .from('materials')
                    .select('*');

                const { data: goals } = await supabase
                    .from('goals')
                    .select('*')
                    .order('date', { ascending: true });

                // Build comprehensive context
                let context = "あなたは学習管理アプリのAIアシスタントです。ユーザーの学習状況をもとに、1〜2行で簡潔かつ具体的なアドバイスや励ましの言葉を提供してください。";

                if (goals && goals.length > 0) {
                    const goalsStr = goals.map(g =>
                        `${g.date}: ${g.title} - ${g.description || ''}`
                    ).join('\n');
                    context += `\n\n【目標】\n${goalsStr}`;
                }

                if (records && records.length > 0) {
                    const recordsStr = records.map(r =>
                        `${r.date}: ${r.subject} (${r.duration}分) - ${r.notes || ''}`
                    ).join('\n');
                    context += `\n\n【最近の学習記録】\n${recordsStr}`;
                } else {
                    context += "\n\n【最近の学習記録】\nまだ学習記録がありません";
                }

                if (materials && materials.length > 0) {
                    const materialsStr = materials.map(m => m.name).join(', ');
                    context += `\n\n【登録教材】\n${materialsStr}`;
                }

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [
                            { role: "user", content: context }
                        ]
                    }),
                });

                const data = await res.json();
                if (data.message) {
                    setFeedback(data.message);
                }
            } catch (error) {
                console.error("Failed to fetch feedback", error);
                setFeedback("フィードバックの取得に失敗しました。");
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    return (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full"
            >
                {feedback ? (
                    <p className="text-2xl md:text-3xl font-light text-gray-800 leading-tight text-center">
                        "{feedback}"
                    </p>
                ) : (
                    <p className="text-xl text-gray-600 text-center">
                        フィードバックを生成中...
                    </p>
                )}
            </motion.div>
        </div>
    );
}
