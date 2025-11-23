"use client";

import SleepSchedule from "@/components/SleepSchedule";

export default function SettingsPage() {
    return (
        <div className="h-full w-full p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-light text-gray-900">設定</h1>
                    <p className="text-gray-500">アプリケーションの設定やスケジュールの管理を行います。</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <SleepSchedule />
                </div>
            </div>
        </div>
    );
}
