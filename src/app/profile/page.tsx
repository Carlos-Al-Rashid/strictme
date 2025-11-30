import { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
    title: "プロフィール",
};

export default function ProfilePage() {
    return <ProfileClient />;
}
