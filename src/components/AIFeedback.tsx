"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AIFeedback() {
    const [feedback, setFeedback] = useState<string>("監視システム初期化中...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                // Get recent study records
                const savedRecords = localStorage.getItem("study_records");
                let context = "現在の学習状況に基づいて、簡潔なフィードバックをください。";

                if (savedRecords) {
                    const records = JSON.parse(savedRecords).slice(0, 5); // Last 5 records
                    if (records.length > 0) {
                        const recordsStr = records.map((r: any) =>
                            `- ${r.date}: ${r.subject} (${Math.floor(r.duration / 60)}時間${r.duration % 60}分) メモ: ${r.notes}`
                        ).join("\n");
                        context += `\n\n直近の学習記録:\n${recordsStr}`;
                    } else {
                        context += "\n(まだ学習記録がありません)";
                    }
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
                setFeedback("中央知能への接続に失敗しました。");
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-white">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 via-white to-white opacity-50" />

            <motion.div
                key={feedback}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 text-center max-w-2xl px-6"
            >
                <h2 className="text-sm font-medium text-gray-400 mb-4 tracking-widest uppercase">
                    AI 観測
                </h2>
                <p className="text-3xl md:text-4xl font-light text-gray-800 leading-tight">
                    "{feedback}"
                </p>
            </motion.div>
        </div>
    );
}
