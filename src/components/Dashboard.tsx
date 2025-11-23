"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, BarChart2, List } from "lucide-react";
import clsx from "clsx";
import GoalTimeline from "./GoalTimeline";
import DailyRecordList from "./DailyRecordList";

export default function Dashboard({ readOnly = false }: { readOnly?: boolean }) {
    const [activeTab, setActiveTab] = useState("daily");

    return (
        <div className="h-full w-full bg-gray-50/50 border-t border-gray-100 flex flex-col">
            {/* Navigation Tabs */}
            <div className="flex items-center justify-center space-x-8 py-6 border-b border-gray-100/50">
                <TabButton
                    active={activeTab === "daily"}
                    onClick={() => setActiveTab("daily")}
                    icon={<List size={20} />}
                    label="今日の記録"
                />
                <TabButton
                    active={activeTab === "timeline"}
                    onClick={() => setActiveTab("timeline")}
                    icon={<Calendar size={20} />}
                    label="タイムライン"
                />
                <TabButton
                    active={activeTab === "stats"}
                    onClick={() => setActiveTab("stats")}
                    icon={<BarChart2 size={20} />}
                    label="統計"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full max-w-4xl mx-auto"
                >
                    {activeTab === "daily" && <DailyRecordList />}
                    {activeTab === "timeline" && <GoalTimeline readOnly={readOnly} />}
                    {activeTab === "stats" && <StatsView />}
                </motion.div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200",
                active ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-100"
            )}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}

function StatsView() {
    return (
        <div className="flex items-center justify-center h-full text-gray-400">
            <p>学習統計はここに表示されます。</p>
        </div>
    );
}
