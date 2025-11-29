"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const genderOptions = [
    { value: "男性", label: "男性" },
    { value: "女性", label: "女性" },
    { value: "その他", label: "その他" },
    { value: "回答しない", label: "回答しない" },
];

export default function EditGenderPage() {
    const [gender, setGender] = useState("");
    const [loading, setLoading] = useState(true);
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
            .select('gender')
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
            setGender(data.gender || "");
        }

        setLoading(false);
    };

    const handleSelect = async (value: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ gender: value })
            .eq('id', user.id);

        if (!error) {
            router.push('/profile/edit');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => router.push('/profile/edit')} className="mr-3">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">性別</h1>
            </div>

            {/* Options */}
            <div className="bg-white mt-4">
                {genderOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50"
                    >
                        <span className="text-sm text-gray-700">{option.label}</span>
                        {gender === option.value && <Check size={20} className="text-blue-500" />}
                    </button>
                ))}
            </div>
        </div>
    );
}
