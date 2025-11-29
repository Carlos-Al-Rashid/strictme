"use client";

import { useState, useEffect } from "react";
import { Search, User, Book, ChevronRight, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Profile = {
    id: string;
    display_name: string | null;
    email: string;
};

type Material = {
    id: string;
    name: string;
    image: string | null;
};

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [searchType, setSearchType] = useState<"user" | "material" | null>(null);
    const [users, setUsers] = useState<Profile[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSearch = async (type: "user" | "material", searchQuery: string) => {
        setLoading(true);
        if (type === "user") {
            const { data } = await supabase
                .from('profiles')
                .select('id, display_name, email') // Assuming email is accessible or just display_name
                .ilike('display_name', `%${searchQuery}%`)
                .limit(20);
            if (data) setUsers(data as Profile[]);
        } else if (type === "material") {
            const { data } = await supabase
                .from('materials')
                .select('*')
                .ilike('name', `%${searchQuery}%`)
                .limit(20);
            if (data) setMaterials(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (searchType && query) {
            const timer = setTimeout(() => {
                handleSearch(searchType, query);
            }, 500);
            return () => clearTimeout(timer);
        } else if (searchType && !query) {
            // Fetch initial data if needed, or clear
            if (searchType === "user") setUsers([]);
            if (searchType === "material") setMaterials([]);
        }
    }, [query, searchType]);

    return (
        <div className="h-full w-full bg-white overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 md:px-8">
                <h1 className="text-lg font-bold text-gray-900 mb-6">さがす</h1>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="検索"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                    />
                </div>

                {/* Navigation Buttons */}
                {!searchType && !query && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setSearchType("user")}
                            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <User size={32} className="text-gray-700 mb-2" />
                            <span className="font-bold text-gray-900 text-sm">ユーザー</span>
                            <span className="text-xs text-gray-400 mt-1">友達を探す</span>
                        </button>
                        <button
                            onClick={() => setSearchType("material")}
                            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Book size={32} className="text-gray-700 mb-2" />
                            <span className="font-bold text-gray-900 text-sm">教材</span>
                            <span className="text-xs text-gray-400 mt-1">教材を探す</span>
                        </button>
                    </div>
                )}

                {/* Tabs (Visual only for now) */}
                {!searchType && !query && (
                    <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-2">
                        <button className="px-4 py-1.5 bg-gray-100 text-gray-900 rounded-full text-sm font-bold whitespace-nowrap">すべて</button>
                        <button className="px-4 py-1.5 text-gray-500 hover:bg-gray-50 rounded-full text-sm font-bold whitespace-nowrap">記事</button>
                        <button className="px-4 py-1.5 text-gray-500 hover:bg-gray-50 rounded-full text-sm font-bold whitespace-nowrap">傾向と対策</button>
                        <button className="px-4 py-1.5 text-gray-500 hover:bg-gray-50 rounded-full text-sm font-bold whitespace-nowrap">ユーザー</button>
                    </div>
                )}

                {/* Search Results */}
                {(searchType || query) && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900">
                                {searchType === "user" ? "ユーザー検索" : searchType === "material" ? "教材検索" : "検索結果"}
                            </h2>
                            <button onClick={() => { setSearchType(null); setQuery(""); }} className="text-sm text-gray-500 hover:text-black">
                                クリア
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500">検索中...</div>
                        ) : (
                            <div className="space-y-4">
                                {searchType === "user" && users.map(user => (
                                    <div key={user.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User size={20} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{user.display_name || "ゲスト"}</p>
                                            <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                ))}
                                {searchType === "material" && materials.map(material => (
                                    <div key={material.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                                        <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200">
                                            {material.image ? (
                                                <img src={material.image} alt={material.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Book size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                        <p className="font-bold text-gray-900">{material.name}</p>
                                    </div>
                                ))}
                                {((searchType === "user" && users.length === 0) || (searchType === "material" && materials.length === 0)) && (
                                    <div className="text-center py-8 text-gray-400">
                                        {query ? "見つかりませんでした" : "検索ワードを入力してください"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Articles Section (Static) */}
                {!searchType && !query && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-lg text-gray-900">記事</h2>
                            <button className="text-xs text-gray-500 hover:text-black">もっと見る</button>
                        </div>

                        <div className="space-y-6">
                            {/* Article 1 */}
                            <div className="flex gap-4 group cursor-pointer">
                                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=300&fit=crop" alt="Article" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        知っておきたい！ 「奨学金制度」で広がる未来
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500">#PR</span>
                                        <span className="text-xs text-gray-500">#進路選び</span>
                                        <span className="text-xs text-gray-500">#教育資金</span>
                                    </div>
                                </div>
                            </div>

                            {/* Article 2 */}
                            <div className="flex gap-4 group cursor-pointer">
                                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=300&h=300&fit=crop" alt="Article" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        今年も開催します！ 「カロリーメイト マンスリー没頭チャレンジ ～誰もう、すべてを栄養にして。～」
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500">#PR</span>
                                        <span className="text-xs text-gray-500">#カロリーメイト</span>
                                        <span className="text-xs text-gray-500">#受験生応援</span>
                                    </div>
                                </div>
                            </div>

                            {/* Article 3 */}
                            <div className="flex gap-4 group cursor-pointer">
                                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=300&fit=crop" alt="Article" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        ＜九州・沖縄エリア＞地方試験会場 成蹊大学
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500">#PR</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
