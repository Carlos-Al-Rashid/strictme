import { Metadata } from "next";
import ProfileEditClient from "./ProfileEditClient";

export const metadata: Metadata = {
    title: "プロフィール編集",
};

export default function ProfileEditPage() {
    return <ProfileEditClient />;
}
