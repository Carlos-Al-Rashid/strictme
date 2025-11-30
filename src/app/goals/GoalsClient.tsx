"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from "date-fns";
import { ja } from "date-fns/locale";

type StudyRecord = {
    id: string;
    date: string;
    duration: number;
    subject: string;
};

export default function GoalsClient() {
    const [activeTab, setActiveTab] = useState("週間");
    const [records, setRecords] = useState<StudyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const supabase = createClient();

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('study_records')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (data && !error) {
            setRecords(data);
        }
        setLoading(false);
    };

    // Calculate stats
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const todayRecords = records.filter(r => {
        try {
            const recordDate = new Date(r.date);
            return !isNaN(recordDate.getTime()) && isSameDay(recordDate, today);
        } catch (e) {
            return false;
        }
    });
    const todayMinutes = todayRecords.reduce((sum, r) => sum + r.duration, 0);
    const todayHours = Math.floor(todayMinutes / 60);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    });
    const last7DaysRecords = records.filter(r => {
        try {
            const recordDate = new Date(r.date);
            return !isNaN(recordDate.getTime()) && last7Days.some(d => isSameDay(recordDate, d));
        } catch (e) {
            return false;
        }
    });
    const last7DaysMinutes = last7DaysRecords.reduce((sum, r) => sum + r.duration, 0);
    const averageHours = Math.floor(last7DaysMinutes / 7 / 60);

    const weekRecords = records.filter(r => {
        try {
            const recordDate = new Date(r.date);
            return !isNaN(recordDate.getTime()) && recordDate >= weekStart && recordDate <= weekEnd;
        } catch (e) {
            return false;
        }
    });
    const weekMinutes = weekRecords.reduce((sum, r) => sum + r.duration, 0);
    const weekHours = Math.floor(weekMinutes / 60);

    const daysWithRecords = new Set(weekRecords.map(r => format(new Date(r.date), 'yyyy-MM-dd'))).size;
    const totalDaysInWeek = 7;

    // Calendar data
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const recordsByDate = records.reduce((acc, record) => {
        try {
            const recordDate = new Date(record.date);
            if (isNaN(recordDate.getTime())) return acc;
            const dateKey = format(recordDate, 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(record);
        } catch (e) {
            // Skip invalid dates
        }
        return acc;
    }, {} as Record<string, StudyRecord[]>);

    // Get this week's daily records for bar chart
    const thisWeekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const thisWeekRecords = thisWeekDays.map(day => ({
        date: day,
        records: records.filter(r => {
            try {
                const recordDate = new Date(r.date);
                return !isNaN(recordDate.getTime()) && isSameDay(recordDate, day);
            } catch (e) {
                return false;
            }
        })
    }));

    const hasWeekRecords = weekRecords.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-900">レポート</h1>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="flex">
                    {["週間", "月間", "累計"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "flex-1 py-3 text-sm font-bold relative",
                                activeTab === tab ? "text-blue-500" : "text-gray-400"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto">
                {/* Stats Section */}
                <div className="bg-white mt-2 px-4 py-4">
                    <div className="flex justify-around text-center mb-6">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">今日</div>
                            <div className="text-2xl font-bold text-gray-900">{todayHours}時間</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">7日平均</div>
                            <div className="text-2xl font-bold text-gray-900">{averageHours}時間</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">週間累計時間</div>
                            <div className="text-2xl font-bold text-gray-900">{weekHours}時間</div>
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-500 mb-4">
                        今週勉強したのは{daysWithRecords}日がありました
                    </div>

                    {/* Achievement Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-xs font-bold text-gray-500 mb-3">今週の目標達成</div>
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 flex-shrink-0">
                                <svg className="w-16 h-16 transform -rotate-90">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="#e5e7eb"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="#3b82f6"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 28}`}
                                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - daysWithRecords / totalDaysInWeek)}`}
                                        className="transition-all duration-300"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-blue-500">
                                        {Math.round((daysWithRecords / totalDaysInWeek) * 100)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-gray-900">
                                    1週間の目標を達成して
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    100%通過を目指そう！
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="bg-white mt-8 px-4 py-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                            onClick={() => {
                                const newMonth = new Date(currentMonth);
                                newMonth.setMonth(newMonth.getMonth() - 1);
                                setCurrentMonth(newMonth);
                            }}
                            className="text-gray-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-sm font-bold text-gray-700">
                            {format(currentMonth, 'yyyy年M月', { locale: ja })}
                        </div>
                        <button
                            onClick={() => {
                                const newMonth = new Date(currentMonth);
                                newMonth.setMonth(newMonth.getMonth() + 1);
                                setCurrentMonth(newMonth);
                            }}
                            className="text-gray-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
                            <div key={day} className="text-center text-xs text-gray-500 font-bold">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: (getDay(monthStart) + 6) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-12"></div>
                        ))}

                        {/* Calendar days */}
                        {calendarDays.map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const dayRecords = recordsByDate[dateKey] || [];
                            const totalMinutes = dayRecords.reduce((sum, r) => sum + r.duration, 0);
                            const hasRecords = dayRecords.length > 0;
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={dateKey}
                                    className={clsx(
                                        "h-12 flex flex-col items-center justify-center text-xs relative",
                                        isTodayDate && "bg-blue-500 rounded-full text-white font-bold w-8 h-8 mx-auto",
                                        hasRecords && !isTodayDate && "text-blue-500 font-bold",
                                        !hasRecords && !isTodayDate && "text-gray-400"
                                    )}
                                >
                                    <div className="text-sm">{format(day, 'd')}</div>
                                    {hasRecords && (
                                        <div className="text-[9px] text-gray-400">
                                            {Math.floor(totalMinutes / 60)}h
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-right text-xs text-gray-400 mt-2">
                        学習時間 合計 {weekHours}h
                    </div>
                </div>

                {/* Weekly Records Bar Chart */}
                <div className="bg-white mt-4 px-4 py-6">
                    <div className="text-sm font-bold text-gray-700 mb-4">今週のレコード</div>

                    {!hasWeekRecords ? (
                        <div className="text-center text-sm text-gray-400 py-8">
                            今週もレコードがありません
                        </div>
                    ) : (
                        <div className="flex items-end justify-around gap-2 h-40">
                            {thisWeekRecords.map(({ date, records: dayRecords }) => {
                                const totalMinutes = dayRecords.reduce((sum, r) => sum + r.duration, 0);
                                const hours = totalMinutes / 60;
                                const maxHeight = 100;
                                const height = hours > 0 ? Math.max((hours / 4) * maxHeight, 10) : 0;

                                return (
                                    <div key={format(date, 'yyyy-MM-dd')} className="flex-1 flex flex-col items-center gap-1">
                                        {hours > 0 ? (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center mb-1">
                                                    <User size={20} className="text-gray-500" />
                                                </div>
                                                <div className="text-xs text-gray-500">{Math.floor(totalMinutes)}分</div>
                                                <div
                                                    className="w-full bg-blue-500 rounded-t"
                                                    style={{ height: `${height}px` }}
                                                ></div>
                                            </>
                                        ) : (
                                            <div className="w-full h-2 bg-gray-100 rounded"></div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">
                                            {format(date, 'd')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Mock Exam Section */}
                <div className="bg-white mt-4 px-4 py-6 mb-8">
                    <div className="text-sm font-bold text-gray-700 mb-4">模擬試験</div>
                    <div className="border border-gray-200 rounded-lg p-8 text-center">
                        <div className="text-sm text-gray-500 leading-relaxed">
                            模擬や定期試験後の成績を管理できます<br />
                            偏差値や得点などの情報を入れたら<br />
                            グラフで確認しましょう
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
