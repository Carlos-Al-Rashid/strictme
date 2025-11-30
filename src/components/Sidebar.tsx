"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutList,
    PenTool,
    BarChart2,
    Search,
    MoreHorizontal,
    Award,
    X,
    User
} from "lucide-react";
import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
    { href: "/", label: "タイムライン", icon: LayoutList },
    { href: "/record", label: "記録する", icon: PenTool },
    { href: "/goals", label: "レポート", icon: BarChart2 },
    { href: "/materials", label: "さがす", icon: Search },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch profile display name and avatar
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    if (profile.display_name) {
                        setUserEmail(profile.display_name);
                    } else {
                        setUserEmail(user.email || null);
                    }
                    setAvatarUrl(profile.avatar_url);
                } else {
                    setUserEmail(user.email || null);
                }
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        if (mobileMenuOpen) {
            setMobileMenuOpen(false);
        }
    }, [pathname, mobileMenuOpen]);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    const navLink = (item: typeof navItems[number]) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={clsx(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                    isActive
                        ? "text-blue-500 font-bold bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
            >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm">{item.label}</span>
            </Link>
        );
    };

    const achievementLink = (
        <Link
            href="/achievement-report"
            onClick={closeMobileMenu}
            className={clsx(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                pathname === "/achievement-report" ? "text-blue-500 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
        >
            <Award size={20} />
            <span className="text-sm">達成報告</span>
        </Link>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden md:flex h-screen w-64 bg-white flex-col items-start py-8 z-50 fixed left-0 top-0"
            >
                {/* Profile Section */}
                <Link href="/profile" className="px-6 mb-8 flex items-center space-x-3 w-full hover:bg-gray-50 py-2 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="text-gray-500" size={24} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                            {userEmail ? userEmail.split('@')[0] : "Guest"}
                        </p>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 w-full px-4 space-y-1">
                    {navItems.map((item) => navLink(item))}
                    {achievementLink}
                </nav>
            </motion.div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMobileMenu}
                        />
                        <motion.div
                            className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-xl flex flex-col"
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                        >
                            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-gray-500" size={20} />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">
                                            {userEmail ? userEmail.split("@")[0] : "Guest"}
                                        </span>
                                        <span className="text-xs text-gray-400">プロフィール</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    aria-label="メニューを閉じる"
                                    onClick={closeMobileMenu}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={18} className="text-gray-600" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                                <Link
                                    href="/profile"
                                    onClick={closeMobileMenu}
                                    className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50 text-gray-900 font-semibold"
                                >
                                    <User size={18} />
                                    <span>プロフィールを見る</span>
                                </Link>
                                <div className="space-y-2">
                                    {navItems.map((item) => navLink(item))}
                                    {achievementLink}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
                <nav className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
                                    isActive ? "text-blue-500" : "text-gray-400"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                            </Link>
                        );
                    })}
                    <Link
                        href="/achievement-report"
                        className={clsx(
                            "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
                            pathname === "/achievement-report" ? "text-blue-500" : "text-gray-400"
                        )}
                    >
                        <Award size={24} />
                        <span className="text-[10px] font-medium mt-1">達成</span>
                    </Link>
                </nav>
            </div>
        </>
    );
}
