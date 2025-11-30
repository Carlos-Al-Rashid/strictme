import { OpenAI } from "openai";
import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "OpenAI API key not configured" },
            { status: 500 }
        );
    }

    const openai = new OpenAI({
        apiKey: apiKey,
    });

    try {
        const { messages } = await req.json();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `あなたは厳格ですが役に立つ学習管理AIです。
          あなたの目標は、ユーザーの学習習慣を監視し、客観的で、時には厳しいフィードバックを提供して、ユーザーを軌道に乗せることです。
          ユーザーは受験生です。
          
          コンテキスト:
          - ユーザーは受験生です。学習の進捗やバランスを監視してください。
          - 未来的な、少しロボットのようですが知的な口調を使用してください。
          - 回答は非常に簡潔に、1行から2行程度で収めてください。長文は禁止です。
          - 日本語で回答してください。
          `,
                },
                ...messages,
            ],
        });

        return NextResponse.json({ message: completion.choices[0].message.content });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
    }
}
