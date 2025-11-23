"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Material = {
    id: string;
    name: string;
    image: string | null; // Base64 string
};

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newImage, setNewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("study_materials");
        if (saved) {
            setMaterials(JSON.parse(saved));
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("study_materials", JSON.stringify(materials));
        }
    }, [materials, isLoaded]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                    setNewImage(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const addMaterial = () => {
        if (!newName.trim()) return;
        const newMaterial: Material = {
            id: Math.random().toString(36).substr(2, 9),
            name: newName,
            image: newImage,
        };
        setMaterials([...materials, newMaterial]);
        setNewName("");
        setNewImage(null);
        setIsAdding(false);
    };

    const deleteMaterial = (id: string) => {
        setMaterials(materials.filter((m) => m.id !== id));
    };

    return (
        <div className="h-full w-full p-4 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-light text-gray-900">教材管理</h1>
                        <p className="text-gray-500">使用する教材を登録・編集します。</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-black text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">教材を追加</span>
                    </button>
                </div>

                {/* Add Modal / Form */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-medium">新しい教材</h3>
                                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">教材名</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="例: チャート式 数学II+B"
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">表紙画像</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden"
                                    >
                                        {newImage ? (
                                            <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <ImageIcon size={24} className="mx-auto mb-2" />
                                                <span className="text-xs">クリックして画像を選択</span>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={addMaterial}
                                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        追加する
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Materials Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {materials.map((material) => (
                        <motion.div
                            key={material.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group relative aspect-[3/4] flex flex-col"
                        >
                            <div className="flex-1 bg-gray-50 rounded-xl mb-3 overflow-hidden relative">
                                {material.image ? (
                                    <img src={material.image} alt={material.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-medium text-gray-900 text-center text-sm line-clamp-2">{material.name}</h3>

                            <button
                                onClick={() => deleteMaterial(material.id)}
                                className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}

                    {/* Add Button Placeholder */}
                    <button
                        onClick={() => setIsAdding(true)}
                        className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                        <Plus size={32} className="mb-2" />
                        <span className="text-sm font-medium">追加</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
