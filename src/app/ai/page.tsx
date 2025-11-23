"use client";

import AIChat from "@/components/AIChat";

export default function AIChatPage() {
    return (
        <div className="h-full w-full p-4 md:p-8 flex flex-col">
            <div className="max-w-4xl mx-auto w-full h-full flex flex-col space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-light text-gray-900">AI 相談</h1>
                    <p className="text-gray-500">学習計画や悩みについてAIに相談できます。</p>
                </div>

                <div className="flex-1 h-full min-h-0">
                    <AIChat />
                </div>
            </div>
        </div>
    );
}
