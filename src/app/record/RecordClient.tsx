"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Calendar, Clock, Image as ImageIcon, History, Play, Pause, RotateCcw, MoreHorizontal, Plus, PenTool, Book } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Material = {
    id: string;
    name: string;
    image: string | null;
};

export default function RecordClient() {
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const supabase = createClient();

    const fetchMaterials = async () => {
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (data && !error) {
            setMaterials(data);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    if (selectedMaterial) {
        return (
            <RecordForm
                material={selectedMaterial}
                onClose={() => setSelectedMaterial(null)}
            />
        );
    }

    if (isAddingMaterial) {
        return (
            <AddMaterialView
                onClose={() => setIsAddingMaterial(false)}
                onSave={() => {
                    setIsAddingMaterial(false);
                    fetchMaterials();
                }}
            />
        );
    }

    return (
        <div className="h-full w-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-gray-900">記録する</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-gray-600">
                        <MoreHorizontal size={24} />
                    </button>
                </div>
            </div>

            {/* Material Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                    <h2 className="font-bold text-gray-700 text-sm">カテゴリなし</h2>
                </div>

                <div className="flex flex-wrap gap-4 w-full">
                    {materials.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMaterial(m)}
                            className="flex flex-col items-start text-left group w-28 md:w-32 flex-shrink-0"
                        >
                            <div className="w-full aspect-[3/4] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-2 relative">
                                {m.image ? (
                                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                        <ImageIcon size={24} />
                                    </div>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/50 p-1 rounded-full text-white">
                                        <MoreHorizontal size={12} />
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight w-full break-words">
                                {m.name}
                            </span>
                        </button>
                    ))}

                    {/* Add Material Button (in grid) */}
                    <button
                        onClick={() => setIsAddingMaterial(true)}
                        className="flex flex-col items-center justify-center text-center w-28 md:w-32 aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0"
                    >
                        <Plus size={24} className="text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-400">教材を追加</span>
                    </button>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => setIsAddingMaterial(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                        <Plus size={16} />
                        <span>教材を追加</span>
                    </button>
                </div>
            </div>

            {/* FAB */}
            <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8">
                <button
                    onClick={() => setSelectedMaterial({ id: 'none', name: '教材なし', image: null })}
                    className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                >
                    <PenTool size={24} />
                </button>
            </div>
        </div>
    );
}

function AddMaterialView({ onClose, onSave }: { onClose: () => void, onSave: () => void }) {
    const [name, setName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview(null);
    };
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const fileToDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const uploadImage = async (file: File, userId: string) => {
        const fileExt = file.name.split(".").pop();
        const uniqueSuffix = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);
        const fileName = `${userId}-${uniqueSuffix}.${fileExt || "jpg"}`;
        const filePath = `materials/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(filePath, file, {
                upsert: true,
                cacheControl: "3600",
                contentType: file.type,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from("materials")
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSave = async () => {
        if (!name) {
            alert("教材名を入力してください");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("ログインが必要です");
            return;
        }
        try {
            setSaving(true);
            let uploadedImage: string | null = null;
            if (imageFile) {
                try {
                    uploadedImage = await uploadImage(imageFile, user.id);
                } catch (storageError) {
                    console.warn("Storage upload failed. Falling back to inline image.", storageError);
                    uploadedImage = await fileToDataUrl(imageFile);
                }
            }

            const { error } = await supabase
                .from('materials')
                .insert([
                    {
                        user_id: user.id,
                        name,
                        image: uploadedImage,
                    }
                ]);

            if (error) {
                throw error;
            }

            setName("");
            clearImage();
            onSave();
        } catch (error: any) {
            console.error("Failed to add material", error);
            alert("教材の追加に失敗しました: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full w-full bg-white flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-600 hover:text-black">
                        <X size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">教材の追加</h1>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`text-sm font-bold transition-colors ${saving ? "text-gray-300 cursor-not-allowed" : "text-blue-500 hover:text-blue-600"}`}
                >
                    {saving ? "保存中..." : "保存"}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex gap-6 mb-8">
                    <div className="w-20 h-28 bg-blue-500 rounded shadow-sm flex items-center justify-center flex-shrink-0">
                        <Book className="text-white/50" size={40} />
                    </div>
                    <div className="flex-1 pt-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">教材名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="教材名"
                            className="w-full text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 focus:border-blue-500 focus:outline-none placeholder-gray-300"
                        />
                        <div className="flex justify-end mt-1">
                            <span className="text-xs text-gray-300">{name.length}/20</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs font-bold text-gray-500 mb-2">教材画像（任意）</p>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="教材画像プレビュー" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-gray-400 text-xs flex flex-col items-center gap-1">
                                            <ImageIcon size={18} />
                                            <span>画像なし</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label
                                        htmlFor="material-image-upload"
                                        className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-gray-800 transition-colors text-center"
                                    >
                                        {imagePreview ? "画像を変更" : "画像を選択"}
                                    </label>
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="px-4 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            画像を削除
                                        </button>
                                    )}
                                    <input
                                        id="material-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                        disabled={saving}
                                    />
                                    <p className="text-[11px] text-gray-400">JPG / PNG / HEIC など、4MB 以内推奨</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100">
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-600">ステータス</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">学習中</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-600">単位</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">ページ</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-600">カテゴリ</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">カテゴリなし</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RecordForm({ material, onClose }: { material: Material, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<"manual" | "stopwatch">("manual");
    const [date, setDate] = useState(format(new Date(), "yyyy年MM月dd日 HH:mm"));
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [notes, setNotes] = useState("");
    const [amount, setAmount] = useState("");
    const supabase = createClient();

    // Stopwatch state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // seconds
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    const handleSave = async () => {
        const duration = activeTab === "manual" ? hours * 60 + minutes : Math.floor(elapsedTime / 60);
        if (duration === 0) {
            alert("学習時間を入力してください");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("ログインが必要です");
            return;
        }

        // Save study record without notes
        const { data: recordData, error: recordError } = await supabase
            .from('study_records')
            .insert([
                {
                    user_id: user.id,
                    subject: material.name,
                    duration,
                    date,
                    notes: '', // Keep notes empty in study_records
                }
            ])
            .select()
            .single();

        if (recordError) {
            alert("記録の保存に失敗しました: " + recordError.message);
            return;
        }

        // If there are notes or amount, save as comment
        const amountPrefix = amount ? "[学習量: " + amount + "] " : "";
        const formattedNotes = amountPrefix + notes;

        if (formattedNotes.trim() && recordData) {
            const { error: commentError } = await supabase
                .from('comments')
                .insert([
                    {
                        record_id: recordData.id,
                        user_id: user.id,
                        content: formattedNotes.trim()
                    }
                ]);

            if (commentError) {
                console.error("コメントの保存に失敗しました:", commentError);
                // Don't show error to user, record is already saved
            }
        }

        alert("記録しました！");
        onClose();
    };

    const setNow = () => {
        setDate(format(new Date(), "yyyy年MM月dd日 HH:mm"));
    };

    const formatStopwatch = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h.toString().padStart(2, '0') + ":" + m.toString().padStart(2, '0') + ":" + s.toString().padStart(2, '0');
    };

    return (
        <div className="h-full w-full bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-600 hover:text-black">
                        <X size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">記録の入力</h1>
                </div>
                <button
                    onClick={handleSave}
                    className="text-blue-500 font-bold hover:text-blue-600 transition-colors"
                >
                    記録
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("manual")}
                        className={clsx(
                            "flex-1 py-3 text-sm font-bold text-center transition-all relative",
                            activeTab === "manual" ? "text-gray-900 bg-gray-600 text-white" : "text-gray-500 bg-gray-100"
                        )}
                    >
                        手動入力
                    </button>
                    <button
                        onClick={() => setActiveTab("stopwatch")}
                        className={clsx(
                            "flex-1 py-3 text-sm font-bold text-center transition-all relative",
                            activeTab === "stopwatch" ? "text-gray-900 bg-gray-600 text-white" : "text-gray-500 bg-gray-100"
                        )}
                    >
                        ストップウォッチ
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Material Info */}
                <div className="bg-white p-4 flex items-center gap-4 border-b border-gray-100">
                    <div className="w-12 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                        {material.image ? (
                            <img src={material.image} alt={material.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={20} />
                            </div>
                        )}
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{material.name}</span>
                </div>

                {activeTab === "manual" ? (
                    <div className="bg-white mt-2 border-y border-gray-200">
                        {/* Date */}
                        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Calendar size={20} />
                                <span className="text-sm font-bold text-gray-700">{date}</span>
                            </div>
                            <button onClick={setNow} className="text-xs font-bold text-blue-500 hover:text-blue-600">
                                現時刻
                            </button>
                        </div>

                        {/* Duration */}
                        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-3 text-gray-600">
                                <History size={20} />
                                <span className="text-sm font-bold text-gray-700">学習時間</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={hours}
                                    onChange={(e) => setHours(Number(e.target.value))}
                                    className="w-12 text-right p-1 border-b border-gray-300 focus:border-black outline-none font-bold"
                                />
                                <span className="text-sm text-gray-600">時間</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(Number(e.target.value))}
                                    className="w-12 text-right p-1 border-b border-gray-300 focus:border-black outline-none font-bold"
                                />
                                <span className="text-sm text-gray-600">分</span>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-gray-600">
                                <PenTool size={20} />
                                <span className="text-sm font-bold text-gray-700">学習量</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="p.10 ~ p.20"
                                    className="text-right p-1 border-b border-gray-300 focus:border-black outline-none font-bold w-32"
                                />
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </div>
                ) : (
                    /* Stopwatch View */
                    <div className="bg-white mt-2 border-y border-gray-200 px-4 py-12 flex flex-col items-center justify-center space-y-8">
                        <div className="text-6xl font-light tabular-nums tracking-wider text-gray-800">
                            {formatStopwatch(elapsedTime)}
                        </div>
                        <div className="flex items-center gap-6">
                            {!isRunning ? (
                                <button
                                    onClick={() => setIsRunning(true)}
                                    className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
                                >
                                    <Play size={28} className="ml-1" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsRunning(false)}
                                    className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors"
                                >
                                    <Pause size={28} />
                                </button>
                            )}
                            <button
                                onClick={() => { setIsRunning(false); setElapsedTime(0); }}
                                className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                                <RotateCcw size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className="mt-4 bg-white border-y border-gray-200 p-4 min-h-[150px]">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="要点・ひとことメモ"
                        className="w-full h-full resize-none focus:outline-none text-gray-700 placeholder-gray-300 text-sm"
                    />
                </div>

                {/* Image Attachment */}
                <div className="mt-4 bg-white border-y border-gray-200 px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 text-gray-600">
                        <ImageIcon size={20} />
                        <span className="text-sm font-bold text-gray-400">画像</span>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                </div>
            </div>
        </div>
    );
}
