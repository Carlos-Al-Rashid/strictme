"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditNicknamePage() {
    const [nickname, setNickname] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
        }

        // If profile doesn't exist, create it
        if (!data) {
            await supabase
                .from('profiles')
                .insert([{ id: user.id }]);
        } else {
            setNickname(data.display_name || "");
        }

        setLoading(false);
    };

    const handleSave = async () => {
        if (!nickname.trim()) {
            alert("ニックネームを入力してください");
            return;
        }

        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ display_name: nickname.trim() })
            .eq('id', user.id);

        setSaving(false);

        if (error) {
            alert("保存に失敗しました");
        } else {
            router.push('/profile/edit');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => router.push('/profile/edit')} className="mr-3">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">ニックネーム</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !nickname.trim()}
                    className="text-blue-500 font-medium disabled:opacity-50"
                >
                    {saving ? '保存中...' : '完了'}
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="ニックネームを入力"
                    className="w-full p-4 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-2">※50文字以内で入力してください</p>
            </div>
        </div>
    );
}
