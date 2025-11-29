"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function AIPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "こんにちは！学習に関する相談に乗ります。何でも聞いてください。" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isComposing) {
            e.preventDefault();
            sendMessage();
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // Fetch all user data from Supabase
            const { data: records } = await supabase
                .from('study_records')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            const { data: materials } = await supabase
                .from('materials')
                .select('*')
                .limit(10);

            const { data: goals } = await supabase
                .from('goals')
                .select('*')
                .order('date', { ascending: true });

            // Build comprehensive context
            let contextInfo = "";

            if (goals && goals.length > 0) {
                const goalsStr = goals.map(g =>
                    `${g.date}: ${g.title} - ${g.description || '詳細なし'}`
                ).join('\n');
                contextInfo += `\n\n【目標】\n${goalsStr}`;
            }

            if (records && records.length > 0) {
                const recordsStr = records.map(r =>
                    `${r.date}: ${r.subject} (${r.duration}分) - ${r.notes || 'メモなし'}`
                ).join('\n');
                contextInfo += `\n\n【最近の学習記録】\n${recordsStr}`;
            }

            if (materials && materials.length > 0) {
                const materialsStr = materials.map(m => m.name).join(', ');
                contextInfo += `\n\n【登録教材】\n${materialsStr}`;
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.role === "user" && contextInfo ? m.content + contextInfo : m.content
                    })).slice(-10),
                }),
            });

            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: "assistant", content: "エラーが発生しました。もう一度お試しください。" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-6">
                <h1 className="text-2xl font-light text-gray-900">AI相談</h1>
                <p className="text-sm text-gray-500 mt-1">学習記録や教材情報を基に、AIがアドバイスします</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user"
                            ? "bg-black text-white rounded-tr-none"
                            : "bg-white text-black rounded-tl-none border border-gray-200"
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white text-gray-400 p-4 rounded-2xl rounded-tl-none border border-gray-200">
                            <Loader2 size={16} className="animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 p-4">
                <div className="max-w-4xl mx-auto flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="質問や相談を入力..."
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-sm text-black"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
