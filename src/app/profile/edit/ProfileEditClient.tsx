"use client";

import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import {
    ChevronLeft,
    ChevronRight,
    Globe,
    User as UserIcon,
    Loader2,
    Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AvatarUpload from "@/components/AvatarUpload";

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

const EMPTY_PROFILE: Profile = {
    id: "",
    display_name: null,
    bio: "",
    avatar_url: null,
    gender: "",
    birth_year: "",
    birthday: "",
    prefecture: "",
    grade: "",
    high_school: "",
    university: "",
    follower_message: "",
};

const genderOptions = ["男性", "女性", "その他", "回答しない"] as const;

type Goal = {
    id: string;
    title: string;
    description: string | null;
    date: string | null;
};

export default function ProfileEditClient() {
    const router = useRouter();
    const supabase = createClient();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [formValues, setFormValues] = useState({
        bio: "",
        gender: "",
        birth_year: "",
        birthday: "",
        prefecture: "",
        grade: "",
        high_school: "",
        university: "",
        follower_message: "",
    });
    const [targetSchools, setTargetSchools] = useState<TargetSchool[]>([]);
    const [newSchool, setNewSchool] = useState({ school_name: "", faculty: "" });

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [schoolSavingId, setSchoolSavingId] = useState<string | null>(null);
    const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [goalSavingId, setGoalSavingId] = useState<string | null>(null);
    const [goalDeletingId, setGoalDeletingId] = useState<string | null>(null);
    const [newGoal, setNewGoal] = useState({ title: "", date: "", description: "" });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            router.replace("/login");
            return;
        }

        setCurrentUserId(user.id);

        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        let ensuredProfile = profileData;

        if (!profileData) {
            const { data: createdProfile } = await supabase
                .from("profiles")
                .insert([{ id: user.id }])
                .select("*")
                .single();
            ensuredProfile = createdProfile as Profile;
        }

        const finalProfile = ensuredProfile ?? { ...EMPTY_PROFILE, id: user.id };
        setProfile(finalProfile);
        setFormValues({
            bio: finalProfile.bio ?? "",
            gender: finalProfile.gender ?? "",
            birth_year: finalProfile.birth_year ?? "",
            birthday: finalProfile.birthday ?? "",
            prefecture: finalProfile.prefecture ?? "",
            grade: finalProfile.grade ?? "",
            high_school: finalProfile.high_school ?? "",
            university: finalProfile.university ?? "",
            follower_message: finalProfile.follower_message ?? "",
        });

        await Promise.all([
            loadTargetSchools(user.id),
            loadGoals(user.id),
        ]);
        setLoading(false);
    };

    const loadTargetSchools = async (userId: string) => {
        const { data } = await supabase
            .from("target_schools")
            .select("id, school_name, faculty")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

        setTargetSchools(data ?? []);
    };

    const loadGoals = async (userId: string) => {
        const { data } = await supabase
            .from("goals")
            .select("id, title, description, date")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        setGoals(data ?? []);
    };

    const handleFormChange = (
        field: keyof typeof formValues,
        value: string
    ) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleProfileSave = async () => {
        if (!profile) return;
        setSavingProfile(true);

        const payload = {
            bio: formValues.bio.trim() || null,
            gender: formValues.gender || null,
            birth_year: formValues.birth_year.trim() || null,
            birthday: formValues.birthday || null,
            prefecture: formValues.prefecture.trim() || null,
            grade: formValues.grade.trim() || null,
            high_school: formValues.high_school.trim() || null,
            university: formValues.university.trim() || null,
            follower_message: formValues.follower_message.trim() || null,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", profile.id)
            .select("*")
            .single();

        if (error) {
            alert("プロフィールの保存に失敗しました");
        } else if (data) {
            setProfile(data as Profile);
            alert("プロフィールを更新しました");
        }

        setSavingProfile(false);
    };

    const handleNewSchoolSave = async () => {
        if (!currentUserId) return;
        if (!newSchool.school_name.trim()) {
            alert("志望校名を入力してください");
            return;
        }
        setSchoolSavingId("new");

        const { data, error } = await supabase
            .from("target_schools")
            .insert([
                {
                    user_id: currentUserId,
                    school_name: newSchool.school_name.trim(),
                    faculty: newSchool.faculty.trim() || null,
                },
            ])
            .select("id, school_name, faculty")
            .single();

        if (error) {
            alert("志望校の追加に失敗しました");
        } else if (data) {
            setTargetSchools((prev) => [...prev, data as TargetSchool]);
            setNewSchool({ school_name: "", faculty: "" });
        }

        setSchoolSavingId(null);
    };

    const handleSchoolChange = (
        id: string,
        field: "school_name" | "faculty",
        value: string
    ) => {
        setTargetSchools((prev) =>
            prev.map((school) =>
                school.id === id ? { ...school, [field]: value } : school
            )
        );
    };

    const handleExistingSchoolSave = async (id: string) => {
        const school = targetSchools.find((s) => s.id === id);
        if (!school) return;
        if (!school.school_name.trim()) {
            alert("志望校名を入力してください");
            return;
        }

        setSchoolSavingId(id);
        const { data, error } = await supabase
            .from("target_schools")
            .update({
                school_name: school.school_name.trim(),
                faculty: school.faculty?.trim() || null,
            })
            .eq("id", id)
            .select("id, school_name, faculty")
            .single();

        if (error) {
            alert("志望校の更新に失敗しました");
        } else if (data) {
            setTargetSchools((prev) =>
                prev.map((item) => (item.id === id ? (data as TargetSchool) : item))
            );
        }

        setSchoolSavingId(null);
    };

    const handleSchoolDelete = async (id: string) => {
        setDeletingSchoolId(id);
        const { error } = await supabase
            .from("target_schools")
            .delete()
            .eq("id", id);

        if (error) {
            alert("志望校の削除に失敗しました");
        } else {
            setTargetSchools((prev) => prev.filter((school) => school.id !== id));
        }

        setDeletingSchoolId(null);
    };

    const handleGoalChange = (
        id: string,
        field: "title" | "date" | "description",
        value: string
    ) => {
        setGoals((prev) =>
            prev.map((goal) =>
                goal.id === id ? { ...goal, [field]: value } : goal
            )
        );
    };

    const handleGoalSave = async (id: string) => {
        const goal = goals.find((g) => g.id === id);
        if (!goal) return;
        if (!goal.title.trim()) {
            alert("目標タイトルを入力してください");
            return;
        }

        setGoalSavingId(id);
        const { data, error } = await supabase
            .from("goals")
            .update({
                title: goal.title.trim(),
                date: goal.date || null,
                description: goal.description?.trim() || null,
            })
            .eq("id", id)
            .select("id, title, description, date")
            .single();

        if (error) {
            alert("目標の更新に失敗しました");
        } else if (data) {
            setGoals((prev) =>
                prev.map((item) => (item.id === id ? data : item))
            );
        }
        setGoalSavingId(null);
    };

    const handleGoalDelete = async (id: string) => {
        setGoalDeletingId(id);
        const { error } = await supabase
            .from("goals")
            .delete()
            .eq("id", id);

        if (error) {
            alert("目標の削除に失敗しました");
        } else {
            setGoals((prev) => prev.filter((goal) => goal.id !== id));
        }
        setGoalDeletingId(null);
    };

    const handleGoalAdd = async () => {
        if (!currentUserId) return;
        if (!newGoal.title.trim()) {
            alert("目標タイトルを入力してください");
            return;
        }
        setGoalSavingId("new");

        const { data, error } = await supabase
            .from("goals")
            .insert([{
                user_id: currentUserId,
                title: newGoal.title.trim(),
                description: newGoal.description.trim() || null,
                date: newGoal.date || null,
            }])
            .select("id, title, description, date")
            .single();

        if (error) {
            alert("目標の追加に失敗しました");
        } else if (data) {
            setGoals((prev) => [data, ...prev]);
            setNewGoal({ title: "", date: "", description: "" });
        }
        setGoalSavingId(null);
    };

    const disableSave = useMemo(
        () => savingProfile || loading,
        [savingProfile, loading]
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 size={20} className="animate-spin" />
                    <span>読み込み中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => router.push("/profile")} className="mr-3">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">プロフィール編集</h1>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UserIcon size={32} className="text-gray-500" />
                                )}
                            </div>
                            {profile && (
                                <div className="absolute -bottom-2 -right-2">
                                    <AvatarUpload
                                        userId={profile.id}
                                        currentAvatarUrl={profile.avatar_url}
                                        onUploadComplete={(url) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, avatar_url: url } : prev
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">ニックネーム</p>
                            <button
                                onClick={() => router.push("/profile/edit/nickname")}
                                className="text-lg font-bold text-gray-900 hover:text-blue-500 transition-colors"
                            >
                                {profile?.display_name || "ニックネーム未設定"}
                            </button>
                            <p className="text-xs text-gray-400 mt-1">
                                表示名はいつでも変更できます
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 mb-2">
                            目標や決意 / 自己紹介
                        </h2>
                        <textarea
                            value={formValues.bio}
                            onChange={(e) => handleFormChange("bio", e.target.value)}
                            placeholder="例: 今年中に英検準1級合格を目指しています。週25時間の勉強を継続！"
                            rows={4}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-black"
                        />
                        <p className="text-right text-xs text-gray-400 mt-1">
                            {formValues.bio.length}/400
                        </p>
                    </div>
                </section>

                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800">志望校</h2>
                        <span className="text-xs text-gray-400">
                            最大3校まで登録できます
                        </span>
                    </div>

                    <div className="space-y-4">
                        {targetSchools.length === 0 && (
                            <p className="text-sm text-gray-400">
                                志望校が登録されていません。下のフォームから追加してください。
                            </p>
                        )}

                        {targetSchools.map((school) => (
                            <div
                                key={school.id}
                                className="rounded-lg border border-gray-200 p-4 space-y-3"
                            >
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500">
                                        学校名
                                    </label>
                                    <input
                                        value={school.school_name}
                                        onChange={(e) =>
                                            handleSchoolChange(
                                                school.id,
                                                "school_name",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        placeholder="例: 早稲田大学"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500">
                                        学部・学科（任意）
                                    </label>
                                    <input
                                        value={school.faculty ?? ""}
                                        onChange={(e) =>
                                            handleSchoolChange(
                                                school.id,
                                                "faculty",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        placeholder="例: 政治経済学部"
                                    />
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        onClick={() => handleExistingSchoolSave(school.id)}
                                        disabled={schoolSavingId === school.id}
                                        className="px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {schoolSavingId === school.id ? "保存中..." : "保存"}
                                    </button>
                                    <button
                                        onClick={() => handleSchoolDelete(school.id)}
                                        disabled={deletingSchoolId === school.id}
                                        className="px-3 py-1.5 rounded-lg text-sm font-bold text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {deletingSchoolId === school.id ? "削除中..." : "削除"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3">
                        <p className="text-sm font-bold text-gray-700">志望校を追加</p>
                        <input
                            value={newSchool.school_name}
                            onChange={(e) =>
                                setNewSchool((prev) => ({ ...prev, school_name: e.target.value }))
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            placeholder="学校名を入力"
                        />
                        <input
                            value={newSchool.faculty}
                            onChange={(e) =>
                                setNewSchool((prev) => ({ ...prev, faculty: e.target.value }))
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            placeholder="学部・学科（任意）"
                        />
                        <button
                            onClick={handleNewSchoolSave}
                            disabled={schoolSavingId === "new"}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500 text-white py-2 text-sm font-bold hover:bg-blue-600 disabled:opacity-50"
                        >
                            {schoolSavingId === "new" ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    追加中...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    志望校を追加
                                </>
                            )}
                        </button>
                    </div>
                </section>

                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800">目標</h2>
                        <span className="text-xs text-gray-400">最大10件まで保存できます</span>
                    </div>

                    <div className="space-y-4">
                        {goals.length === 0 && (
                            <p className="text-sm text-gray-400">まだ目標が登録されていません。</p>
                        )}

                        {goals.map((goal) => (
                            <div key={goal.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">タイトル</label>
                                    <input
                                        value={goal.title}
                                        onChange={(e) => handleGoalChange(goal.id, "title", e.target.value)}
                                        className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        placeholder="例: 早稲田模試で偏差値65以上"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">目標日</label>
                                        <input
                                            type="date"
                                            value={goal.date ?? ""}
                                            onChange={(e) => handleGoalChange(goal.id, "date", e.target.value)}
                                            className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">詳細（任意）</label>
                                        <input
                                            value={goal.description ?? ""}
                                            onChange={(e) => handleGoalChange(goal.id, "description", e.target.value)}
                                            placeholder="例: 毎週○○模試を受ける"
                                            className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleGoalDelete(goal.id)}
                                        disabled={goalDeletingId === goal.id}
                                        className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {goalDeletingId === goal.id ? "削除中..." : "削除"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleGoalSave(goal.id)}
                                        disabled={goalSavingId === goal.id}
                                        className="px-4 py-1.5 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {goalSavingId === goal.id ? "保存中..." : "保存"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-bold text-gray-700">目標を追加</p>
                        <input
                            value={newGoal.title}
                            onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="例: 模試で偏差値70を取る"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={newGoal.date}
                                onChange={(e) => setNewGoal((prev) => ({ ...prev, date: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                            <input
                                value={newGoal.description}
                                onChange={(e) => setNewGoal((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="詳細（任意）"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleGoalAdd}
                            disabled={goalSavingId === "new"}
                            className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center justify-center space-x-2 hover:bg-blue-600 disabled:opacity-50"
                        >
                            {goalSavingId === "new" ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    追加中...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    目標を追加
                                </>
                            )}
                        </button>
                    </div>
                </section>

                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-5">
                    <h2 className="text-sm font-bold text-gray-800">基本情報</h2>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">性別</p>
                            <div className="grid grid-cols-2 gap-2">
                                {genderOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => handleFormChange("gender", option)}
                                        className={clsx(
                                            "px-3 py-2 text-sm rounded-lg border transition-colors",
                                            formValues.gender === option
                                                ? "border-blue-500 bg-blue-50 text-blue-600 font-semibold"
                                                : "border-gray-200 text-gray-600 hover:border-gray-400"
                                        )}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500">
                                    生まれた年
                                </label>
                                <input
                                    type="number"
                                    value={formValues.birth_year}
                                    onChange={(e) => handleFormChange("birth_year", e.target.value)}
                                    placeholder="例: 2006"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500">
                                    誕生日
                                </label>
                                <input
                                    type="date"
                                    value={formValues.birthday}
                                    onChange={(e) => handleFormChange("birthday", e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500">
                                都道府県
                            </label>
                            <input
                                value={formValues.prefecture}
                                onChange={(e) => handleFormChange("prefecture", e.target.value)}
                                placeholder="例: 東京都"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500">
                                学年・職業
                            </label>
                            <input
                                value={formValues.grade}
                                onChange={(e) => handleFormChange("grade", e.target.value)}
                                placeholder="例: 高校3年生 / 予備校生"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-3">
                    <h2 className="text-sm font-bold text-gray-800">学歴</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500">高校</label>
                            <input
                                value={formValues.high_school}
                                onChange={(e) => handleFormChange("high_school", e.target.value)}
                                placeholder="例: 〇〇高等学校"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500">大学 / 予備校</label>
                            <input
                                value={formValues.university}
                                onChange={(e) => handleFormChange("university", e.target.value)}
                                placeholder="例: 〇〇大学 / 〇〇予備校"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-3">
                    <h2 className="text-sm font-bold text-gray-800">フォロワー募集メッセージ</h2>
                    <textarea
                        value={formValues.follower_message}
                        onChange={(e) =>
                            handleFormChange("follower_message", e.target.value)
                        }
                        placeholder="例: 毎朝5時に起きて勉強しています。一緒に励まし合える方、ぜひフォローしてください！"
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:border-black"
                    />
                </section>

                <div className="sticky bottom-6 flex justify-end">
                    <button
                        onClick={handleProfileSave}
                        disabled={disableSave}
                        className="px-6 py-3 rounded-full bg-black text-white font-bold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                    >
                        {savingProfile ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                保存中...
                            </>
                        ) : (
                            <>変更を保存</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

