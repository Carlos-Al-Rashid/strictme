"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function SleepSchedule({ readOnly = false }: { readOnly?: boolean }) {
    const [wakeTime, setWakeTime] = useState("06:00");
    const [sleepTime, setSleepTime] = useState("23:00");
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-light text-gray-800">睡眠スケジュール</h3>
                {!readOnly && (
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-sm text-blue-600 font-medium hover:underline"
                    >
                        {isEditing ? "完了" : "編集"}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                        <Sun size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">起床</p>
                        {isEditing ? (
                            <input
                                type="time"
                                value={wakeTime}
                                onChange={(e) => setWakeTime(e.target.value)}
                                className="text-2xl font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-black"
                            />
                        ) : (
                            <p className="text-2xl font-medium text-gray-900">{wakeTime}</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-500">
                        <Moon size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">就寝</p>
                        {isEditing ? (
                            <input
                                type="time"
                                value={sleepTime}
                                onChange={(e) => setSleepTime(e.target.value)}
                                className="text-2xl font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-black"
                            />
                        ) : (
                            <p className="text-2xl font-medium text-gray-900">{sleepTime}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500">
                    厳格モードが有効です。就寝時間を過ぎて起きていると通知されます。
                </p>
            </div>
        </div>
    );
}
