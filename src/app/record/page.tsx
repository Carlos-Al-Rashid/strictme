"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Calendar, Clock, Image as ImageIcon, History, Play, Pause, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import Link from "next/link";

type StudyRecord = {
    id: string;
    subject: string;
    duration: number; // minutes
    date: string;
    notes: string;
    timestamp: number;
};

const SUBJECTS = ["数学", "英語", "物理", "化学", "国語", "社会", "その他"];

export default function RecordPage() {
    const [activeTab, setActiveTab] = useState<"manual" | "stopwatch">("manual");
    const [subject, setSubject] = useState("教材なし");
    const [date, setDate] = useState(format(new Date(), "yyyy年MM月dd日 HH:mm"));
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [notes, setNotes] = useState("");

    // Materials state
    const [showMaterialSelector, setShowMaterialSelector] = useState(false);
    const [materials, setMaterials] = useState<{ id: string, name: string, image: string | null }[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("study_materials");
        if (saved) {
            setMaterials(JSON.parse(saved));
        }
    }, []);

    // Stopwatch state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // seconds
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    // Load records
    useEffect(() => {
        const saved = localStorage.getItem("study_records");
        if (saved) {
            // In a real app we would parse and set records here if we were displaying them
            // But this page currently only saves new records to the list
            // Wait, the previous implementation DID have a list.
            // The NEW UI (Studyplus-like) removed the list from this page?
            // Let's check the file content.
            // The new UI does NOT show the list. It only saves.
            // So we need to load the existing records to append to them.
        }
        setIsLoaded(true);
    }, []);

    const handleSave = () => {
        // Logic to save record would go here
        // For now, just alert or log
        const duration = activeTab === "manual" ? hours * 60 + minutes : Math.floor(elapsedTime / 60);
        if (duration === 0) {
            alert("学習時間を入力してください");
            return;
        }

        const newRecord = {
            id: Math.random().toString(),
            subject,
            duration,
            date,
            notes,
            timestamp: Date.now(),
        };

        const saved = localStorage.getItem("study_records");
        const records = saved ? JSON.parse(saved) : [];
        localStorage.setItem("study_records", JSON.stringify([newRecord, ...records]));

        alert("記録しました！");
        // Reset or redirect
        setHours(0);
        setMinutes(0);
        setNotes("");
        setElapsedTime(0);
        setIsRunning(false);
    };

    const setNow = () => {
        setDate(format(new Date(), "yyyy年MM月dd日 HH:mm"));
    };

    const formatStopwatch = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-full w-full bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-600 hover:text-black">
                        <X size={24} />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">記録の入力</h1>
                </div>
                <button
                    onClick={handleSave}
                    className="text-gray-400 font-bold hover:text-blue-600 transition-colors"
                >
                    記録
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white px-4 py-2">
                <div className="bg-gray-100 p-1 rounded-lg flex">
                    <button
                        onClick={() => setActiveTab("manual")}
                        className={clsx(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === "manual" ? "bg-gray-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        手動入力
                    </button>
                    <button
                        onClick={() => setActiveTab("stopwatch")}
                        className={clsx(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === "stopwatch" ? "bg-gray-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        ストップウォッチ
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="mt-4 bg-white border-y border-gray-200">
                    {/* Subject Selector */}
                    <div
                        onClick={() => setShowMaterialSelector(true)}
                        className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
                    >
                        <div className="flex items-center gap-3">
                            {/* Show selected material image if available */}
                            {materials.find(m => m.name === subject)?.image && (
                                <img
                                    src={materials.find(m => m.name === subject)?.image!}
                                    alt={subject}
                                    className="w-10 h-10 rounded-md object-cover border border-gray-100"
                                />
                            )}
                            <span className="font-bold text-gray-900">{subject}</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>

                    {/* Material Selector Modal */}
                    <AnimatePresence>
                        {showMaterialSelector && (
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed inset-0 z-50 bg-white flex flex-col"
                            >
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <h2 className="font-bold text-lg">教材を選択</h2>
                                    <button onClick={() => setShowMaterialSelector(false)} className="p-2 bg-gray-100 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <button
                                            onClick={() => { setSubject("教材なし"); setShowMaterialSelector(false); }}
                                            className="p-4 rounded-xl border border-gray-200 text-center hover:bg-gray-50"
                                        >
                                            <span className="font-medium text-gray-600">教材なし</span>
                                        </button>
                                        {materials.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => { setSubject(m.name); setShowMaterialSelector(false); }}
                                                className="flex flex-col items-center gap-2 p-2 rounded-xl border border-gray-200 hover:border-black transition-colors"
                                            >
                                                <div className="w-full aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
                                                    {m.image ? (
                                                        <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <ImageIcon size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 line-clamp-1">{m.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-8 text-center">
                                        <Link href="/materials" className="text-blue-600 font-medium hover:underline">
                                            + 新しい教材を追加
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === "manual" ? (
                        <>
                            {/* Date */}
                            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Calendar size={20} />
                                    <span className="text-gray-700">{date}</span>
                                </div>
                                <button onClick={setNow} className="text-sm font-bold text-blue-500 hover:text-blue-600">
                                    現時刻
                                </button>
                            </div>

                            {/* Duration */}
                            <div className="px-4 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <History size={20} />
                                    <span className="text-gray-700">学習時間</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={hours}
                                        onChange={(e) => setHours(Number(e.target.value))}
                                        className="w-12 text-right p-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">時間</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={minutes}
                                        onChange={(e) => setMinutes(Number(e.target.value))}
                                        className="w-12 text-right p-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">分</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Stopwatch View */
                        <div className="px-4 py-12 flex flex-col items-center justify-center space-y-8">
                            <div className="text-6xl font-light tabular-nums tracking-wider text-gray-800">
                                {formatStopwatch(elapsedTime)}
                            </div>
                            <div className="flex items-center gap-6">
                                {!isRunning ? (
                                    <button
                                        onClick={() => setIsRunning(true)}
                                        className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <Play size={28} className="ml-1" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsRunning(false)}
                                        className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors"
                                    >
                                        <Pause size={28} />
                                    </button>
                                )}
                                <button
                                    onClick={() => { setIsRunning(false); setElapsedTime(0); }}
                                    className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="mt-4 bg-white border-y border-gray-200 p-4 min-h-[150px]">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="要点・ひとことメモ"
                        className="w-full h-full resize-none focus:outline-none text-gray-700 placeholder-gray-300"
                    />
                </div>

                {/* Image Attachment */}
                <div className="mt-4 bg-white border-y border-gray-200 px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 text-gray-600">
                        <ImageIcon size={20} />
                        <span className="text-gray-400">画像</span>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                </div>
            </div>
        </div>
    );
}
