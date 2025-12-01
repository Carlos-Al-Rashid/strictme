"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SpeedTestPage() {
    const [results, setResults] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const supabase = createClient();

    const runTest = async () => {
        setIsRunning(true);
        setResults(["計測開始..."]);
        const logs: string[] = [];
        const addLog = (msg: string) => {
            logs.push(msg);
            setResults([...logs]);
        };

        try {
            // Test 1: Auth Check
            const t0 = performance.now();
            const { data: { user } } = await supabase.auth.getUser();
            const t1 = performance.now();
            addLog(`Auth Check: ${Math.round(t1 - t0)}ms (User: ${user ? 'Logged In' : 'Guest'})`);

            // Test 2: Simple Count (study_records)
            const t2 = performance.now();
            const { count, error: countError } = await supabase
                .from("study_records")
                .select("*", { count: "exact", head: true });
            const t3 = performance.now();
            if (countError) throw countError;
            addLog(`Simple Count (study_records): ${Math.round(t3 - t2)}ms (Count: ${count})`);

            // Test 3: Normal Query (Limit 50)
            const t4 = performance.now();
            const { error: queryError } = await supabase
                .from("study_records")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);
            const t5 = performance.now();
            if (queryError) throw queryError;
            addLog(`Normal Query (Limit 50): ${Math.round(t5 - t4)}ms`);

            // Test 4: View Query (Limit 50) - The optimized one
            const t6 = performance.now();
            const { error: viewError } = await supabase
                .from("study_records_with_details")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);
            const t7 = performance.now();
            if (viewError) throw viewError;
            addLog(`View Query (Limit 50): ${Math.round(t7 - t6)}ms`);

            addLog("計測完了");

        } catch (e: any) {
            addLog(`Error: ${e.message || e}`);
            console.error(e);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-6 text-gray-900">Supabase 速度検証</h1>

                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        データベースへの接続速度をテストします。以下のボタンを押してください。
                    </p>
                    <button
                        onClick={runTest}
                        disabled={isRunning}
                        className={`px-6 py-3 rounded-lg font-bold text-white transition-colors ${isRunning
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {isRunning ? "計測中..." : "テスト実行"}
                    </button>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 min-h-[200px]">
                    {results.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">
                            {log}
                        </div>
                    ))}
                    {results.length === 0 && (
                        <div className="text-gray-500">ここに結果が表示されます...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
