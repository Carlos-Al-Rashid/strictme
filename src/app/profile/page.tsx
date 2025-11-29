"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Globe, Plus, ChevronRight, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import AvatarUpload from "@/components/AvatarUpload";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

type Profile = {
    id: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    gender: string | null;
    birth_year: string | null;
    birthday: string | null;
    prefecture: string | null;
    grade: string | null;
    high_school: string | null;
    university: string | null;
    follower_message: string | null;
};

type TargetSchool = {
    id: string;
    school_name: string;
    faculty: string | null;
};

type StudyRecord = {
    id: string;
    subject: string;
    duration: number;
    notes: string | null;
    created_at: string;
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [targetSchools, setTargetSchools] = useState<TargetSchool[]>([]);
    const [loading, setLoading] = useState(true);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [addingSchool, setAddingSchool] = useState(false);
    const [savingSchool, setSavingSchool] = useState(false);
    const [newSchool, setNewSchool] = useState({ school_name: "", faculty: "" });
    const [activeTab, setActiveTab] = useState<"timeline" | "report" | "profile">("timeline");
    const [records, setRecords] = useState<StudyRecord[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
        }

        // If profile doesn't exist, create it
        if (!profileData) {
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{ id: user.id }])
                .select()
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
            } else {
                setProfile(newProfile);
            }
        } else {
            setProfile(profileData);
        }

        const { data: schoolsData } = await supabase
            .from('target_schools')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (schoolsData) setTargetSchools(schoolsData);

        await fetchRecords(user.id);

        // Fetch follower count
        const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user.id);

        setFollowerCount(followersCount || 0);

        // Fetch following count
        const { count: followingsCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id);

        setFollowingCount(followingsCount || 0);

        setLoading(false);
    };

    const fetchRecords = async (userId: string) => {
        setRecordsLoading(true);
        const { data, error } = await supabase
            .from('study_records')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setRecords(data);
        }
        setRecordsLoading(false);
    };

    const handleAddSchool = async () => {
        if (!profile) return;
        if (!newSchool.school_name.trim()) {
            alert("志望校名を入力してください");
            return;
        }

        setSavingSchool(true);
        const { data, error } = await supabase
            .from('target_schools')
            .insert([{
                user_id: profile.id,
                school_name: newSchool.school_name.trim(),
                faculty: newSchool.faculty.trim() || null,
            }])
            .select('*')
            .single();

        if (error) {
            alert("志望校の追加に失敗しました");
        } else if (data) {
            setTargetSchools((prev) => [...prev, data]);
            setNewSchool({ school_name: "", faculty: "" });
            setAddingSchool(false);
        }

        setSavingSchool(false);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

    const basicInfo = [
        { label: "性別", value: profile?.gender },
        { label: "生まれた年", value: profile?.birth_year },
        { label: "誕生日", value: profile?.birthday },
        { label: "都道府県", value: profile?.prefecture },
        { label: "学年・職業", value: profile?.grade },
    ];

    const educationInfo = [
        { label: "高校", value: profile?.high_school },
        { label: "大学 / 予備校", value: profile?.university },
    ];

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h > 0 ? `${h}時間` : ""}${m}分`;
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header / Cover Area */}
            <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={32} className="text-gray-500" />
                                )}
                            </div>
                            {profile && (
                                <AvatarUpload
                                    userId={profile.id}
                                    currentAvatarUrl={profile.avatar_url}
                                    onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
                                />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{profile?.display_name || "ゲスト"}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {profile?.grade || profile?.prefecture || "プロフィール編集から詳細を追加してください"}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <button className="hover:underline">{followingCount} フォロー</button>
                                <button className="hover:underline">{followerCount} フォロワー</button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/profile/edit')}
                        className="text-sm text-gray-500 hover:text-black font-medium"
                    >
                        プロフィールを編集
                    </button>
                </div>

                <div className="flex border-b border-gray-200 mt-2 mb-6">
                    {[
                        { key: "timeline", label: "タイムライン" },
                        { key: "report", label: "レポート" },
                        { key: "profile", label: "プロフィール" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={clsx(
                                "flex-1 py-3 text-sm font-bold relative",
                                activeTab === tab.key ? "text-blue-500" : "text-gray-400"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.key && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === "timeline" && (
                    <div className="space-y-4">
                        {recordsLoading ? (
                            <div className="flex items-center justify-center py-12 text-gray-400">
                                <Loader2 size={20} className="animate-spin mr-2" />
                                読み込み中...
                            </div>
                        ) : records.length === 0 ? (
                            <div className="text-sm text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                                まだ記録がありません。学習を記録するとここに表示されます。
                            </div>
                        ) : (
                            records.map((record) => (
                                <div key={record.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>{formatDistanceToNow(new Date(record.created_at), { addSuffix: true, locale: ja })}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 mt-2">{record.subject}</h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatDuration(record.duration)}</p>
                                    {record.notes && (
                                        <p className="text-sm text-gray-600 mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                            {record.notes}
                                        </p>
                                    )}
                                    <div className="flex items-center space-x-6 mt-4 text-xs text-gray-400">
                                        <button className="flex items-center space-x-1 hover:text-gray-600 transition-colors">
                                            <span>コメント</span>
                                        </button>
                                        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                                            <span>いいね！</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "report" && (
                    <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
                        レポート機能は準備中です。詳しい学習統計を確認したい場合は <button className="text-blue-500 underline" onClick={() => router.push('/goals')}>レポートページ</button> をご利用ください。
                    </div>
                )}

                {activeTab === "profile" && (
                    <>
                {/* Target Schools */}
                <div className="mb-8 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800">志望校</h2>
                    </div>
                    <div className="space-y-3">
                        {targetSchools.length > 0 ? targetSchools.map(school => (
                            <div key={school.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div className="flex items-center space-x-2">
                                    <Globe size={16} className="text-gray-400" />
                                    <span className="text-sm text-gray-700">
                                        {school.school_name}
                                        {school.faculty ? ` ${school.faculty}` : ""}
                                    </span>
                                </div>
                                <ChevronRight size={16} className="text-gray-300" />
                            </div>
                        )) : (
                            <div className="text-sm text-gray-400 py-2">志望校が登録されていません</div>
                        )}
                        {addingSchool ? (
                            <div className="space-y-3 border border-dashed border-gray-300 rounded-lg p-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">学校名</label>
                                    <input
                                        value={newSchool.school_name}
                                        onChange={(e) => setNewSchool((prev) => ({ ...prev, school_name: e.target.value }))}
                                        className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        placeholder="例: ○○大学"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">学部・学科（任意）</label>
                                    <input
                                        value={newSchool.faculty}
                                        onChange={(e) => setNewSchool((prev) => ({ ...prev, faculty: e.target.value }))}
                                        className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        placeholder="例: 経済学部"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddingSchool(false);
                                            setNewSchool({ school_name: "", faculty: "" });
                                        }}
                                        className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800"
                                        disabled={savingSchool}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddSchool}
                                        disabled={savingSchool}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {savingSchool ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                追加中
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} />
                                                追加
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setAddingSchool(true)}
                                className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors"
                            >
                                <Plus size={16} />
                                <span>志望校を追加</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-gray-100 p-4">
                            <p className="text-xs font-bold text-gray-500 mb-1">志望地域 / 居住地</p>
                            <p className="text-sm text-gray-700">
                                {profile?.prefecture || "未設定"}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-4">
                            <p className="text-xs font-bold text-gray-500 mb-1">学年・職業</p>
                            <p className="text-sm text-gray-700">
                                {profile?.grade || "未設定"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div className="mb-8 border border-gray-200 rounded-xl p-4">
                    <h2 className="font-bold text-gray-800 text-sm mb-4">自己紹介</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                        {profile?.bio?.trim() || "まだ自己紹介が登録されていません。プロフィール編集から追加してください。"}
                    </p>
                </div>

                {/* Basic Info */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h2 className="font-bold text-gray-800 text-sm">基本情報</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {basicInfo.map((info) => (
                            <div key={info.label} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-gray-400">
                                        <Globe size={16} />
                                    </span>
                                    <span className="text-sm font-medium text-gray-600">{info.label}</span>
                                </div>
                                <span className="text-sm text-gray-500">{info.value || "未設定"}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Education */}
                <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h2 className="font-bold text-gray-800 text-sm">学歴</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {educationInfo.map((info) => (
                            <div key={info.label} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-gray-400">
                                        <Globe size={16} />
                                    </span>
                                    <span className="text-sm font-medium text-gray-600">{info.label}</span>
                                </div>
                                <span className="text-sm text-gray-500">{info.value || "未設定"}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Follower Message */}
                <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h2 className="font-bold text-gray-800 text-sm">フォロワー募集</h2>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-700">
                            {profile?.follower_message?.trim() || "フォロワー募集メッセージは未設定です。"}
                        </p>
                    </div>
                </div>
                    </>
                )}
            </div>
        </div>
    );
}
