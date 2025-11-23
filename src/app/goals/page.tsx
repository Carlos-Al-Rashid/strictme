"use client";

import GoalTimeline from "@/components/GoalTimeline";

export default function GoalsPage() {
    return (
        <div className="h-full w-full p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-light text-gray-900">目標設定</h1>
                    <p className="text-gray-500">長期的な目標と短期的なマイルストーンを設定します。</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <GoalTimeline />
                </div>
            </div>
        </div>
    );
}
