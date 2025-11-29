"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

type Message = {
    role: "user" | "assistant";
    content: string;
    action?: {
        label: string;
        type: "update_plan" | "set_goal";
        data: any;
    };
};

export default function AIChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // Mock AI response with action trigger logic
            // In a real app, the backend would return structured data indicating an action
            let aiResponse: Message = { role: "assistant", content: "承知しました。" };

            if (input.includes("計画") || input.includes("変更")) {
                aiResponse = {
                    role: "assistant",
                    content: "数学Bの強化プランを作成しました。以下のボタンで適用しますか？",
                    action: {
                        label: "数学B強化プランを適用",
                        type: "update_plan",
                        data: { focus: "Math B", hours: 2 }
                    }
                };
            } else {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: [...messages, userMessage] }),
                });
                const data = await res.json();
                aiResponse = { role: "assistant", content: data.message };
            }

            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: "assistant", content: "エラーが発生しました。" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action: any) => {
        alert(`アクション実行: ${action.label}\n(実際のアプリではここでDB更新などが走ります)`);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={clsx("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={clsx(
                            "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                            msg.role === "user" ? "bg-black text-white rounded-tr-none" : "bg-gray-100 text-black rounded-tl-none"
                        )}>
                            <p>{msg.content}</p>
                            {msg.action && (
                                <motion.button
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleAction(msg.action)}
                                    className="mt-3 w-full py-2 px-4 bg-white border border-gray-200 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                                >
                                    <span>{msg.action.label}</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-gray-400 text-sm">
                            入力中...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center space-x-2 bg-white p-2 rounded-full border border-gray-200 shadow-sm">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="AIにメッセージを送る..."
                        className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-sm"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
