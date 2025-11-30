import { Metadata } from "next";
import AchievementReportClient from "./AchievementReportClient";

export const metadata: Metadata = {
    title: "達成報告",
};

export default function AchievementReportPage() {
    return <AchievementReportClient />;
}
