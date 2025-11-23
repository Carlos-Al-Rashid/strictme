"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenTool, Target, Bot, Settings, Book } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

const navItems = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/record", label: "勉強記録", icon: PenTool },
    { href: "/materials", label: "教材管理", icon: Book },
    { href: "/goals", label: "目標設定", icon: Target },
    { href: "/ai", label: "AI相談", icon: Bot },
    { href: "/settings", label: "設定", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="h-screen w-20 md:w-64 bg-white border-r border-gray-100 flex flex-col items-center md:items-start py-8 z-50 shadow-sm"
        >
            <div className="mb-12 px-4 md:px-8">
                <h1 className="hidden md:block text-xl font-bold tracking-tighter">Strict Me</h1>
                <div className="md:hidden w-8 h-8 bg-black rounded-full" />
            </div>

            <nav className="flex-1 w-full space-y-2 px-2 md:px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center p-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-black text-white shadow-md"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                            )}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={clsx("ml-3 font-medium hidden md:block", isActive ? "font-bold" : "")}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 w-1 h-8 bg-black rounded-r-full md:hidden"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 md:px-8 text-xs text-gray-400 hidden md:block">
                <p>© 2025 Strict Me</p>
            </div>
        </motion.div>
    );
}
