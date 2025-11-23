"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";

type StudyRecord = {
    id: string;
    subject: string;
    duration: number;
    date: string;
    notes: string;
    timestamp: number;
};

export default function DailyRecordList() {
    const [todaysRecords, setTodaysRecords] = useState<StudyRecord[]>([]);
    const [totalTime, setTotalTime] = useState(0);
    const [materials, setMaterials] = useState<{ id: string, name: string, image: string | null }[]>([]);

    useEffect(() => {
        const savedRecords = localStorage.getItem("study_records");
        if (savedRecords) {
            const allRecords: StudyRecord[] = JSON.parse(savedRecords);
            const todayStr = format(new Date(), "yyyy年MM月dd日");
            const todayISO = format(new Date(), "yyyy-MM-dd");

            const today = allRecords.filter(r =>
                r.date.startsWith(todayStr) || r.date.startsWith(todayISO)
            );

            setTodaysRecords(today);
            setTotalTime(today.reduce((acc, curr) => acc + curr.duration, 0));
        }

        const savedMaterials = localStorage.getItem("study_materials");
        if (savedMaterials) {
            setMaterials(JSON.parse(savedMaterials));
        }
    }, []);

    const getMaterialImage = (subjectName: string) => {
        const matched = materials.find(m => m.name.trim() === subjectName.trim());
        return matched?.image;
    };

    return (
        <div className="space-y-6">
            {/* Debug Info - Remove after fixing */}
            {/* <div className="text-xs text-gray-400">
                Materials: {materials.length}, Records: {todaysRecords.length}
            </div> */}

            <div className="flex items-center justify-between">
                <h3 className="text-xl font-light text-gray-800">今日の学習</h3>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Total Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {Math.floor(totalTime / 60)}<span className="text-sm font-normal text-gray-500">h</span>
                        {totalTime % 60}<span className="text-sm font-normal text-gray-500">m</span>
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {todaysRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p>今日の記録はまだありません</p>
                    </div>
                ) : (
                    todaysRecords.map((record, idx) => {
                        const materialImage = getMaterialImage(record.subject);
                        return (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                                        {materialImage ? (
                                            <img src={materialImage} alt={record.subject} className="w-full h-full object-cover" />
                                        ) : (
                                            <BookOpen size={18} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{record.subject}</h4>
                                        <p className="text-xs text-gray-500">{record.notes || "メモなし"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock size={14} />
                                    <span className="font-medium">
                                        {Math.floor(record.duration / 60)}h {record.duration % 60}m
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

