"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

type Goal = {
    id: string;
    title: string;
    date: string;
    description: string;
};

export default function GoalTimeline({ readOnly = false }: { readOnly?: boolean }) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: "", date: "", description: "" });
    const supabase = createClient();

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .order('date', { ascending: true });

        if (data && !error) {
            setGoals(data);
        }
    };

    const addGoal = async () => {
        if (!newGoal.title || !newGoal.date) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("ログインが必要です");
            return;
        }

        const { error } = await supabase
            .from('goals')
            .insert([
                {
                    user_id: user.id,
                    title: newGoal.title,
                    date: newGoal.date,
                    description: newGoal.description,
                }
            ]);

        if (error) {
            alert("目標の追加に失敗しました: " + error.message);
            return;
        }

        setNewGoal({ title: "", date: "", description: "" });
        setIsAdding(false);
        fetchGoals();
    };

    const deleteGoal = async (id: string) => {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) {
            alert("目標の削除に失敗しました: " + error.message);
            return;
        }

        fetchGoals();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-light text-gray-800">目標の軌跡</h3>
                {!readOnly && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            {isAdding && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3"
                >
                    <input
                        type="text"
                        placeholder="目標タイトル"
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-sm"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    />
                    <input
                        type="date"
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-sm"
                        value={newGoal.date}
                        onChange={(e) => setNewGoal({ ...newGoal, date: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="説明"
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-sm"
                        value={newGoal.description}
                        onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    />
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm text-gray-500">キャンセル</button>
                        <button onClick={addGoal} className="px-3 py-1 text-sm bg-black text-white rounded-md">追加</button>
                    </div>
                </motion.div>
            )}

            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 py-4">
                {goals.map((goal) => (
                    <TimelineItem key={goal.id} goal={goal} onDelete={deleteGoal} readOnly={readOnly} />
                ))}
            </div>
        </div>
    );
}

function TimelineItem({ goal, onDelete, readOnly }: { goal: Goal; onDelete: (id: string) => void; readOnly: boolean }) {
    return (
        <div className="relative pl-8 group">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-black" />
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {format(new Date(goal.date), "yyyy年MM月dd日")}
                    </span>
                    <h4 className="text-lg font-medium text-gray-900 mt-1">{goal.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => onDelete(goal.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
