import { Metadata } from "next";
import RecordClient from "./RecordClient";

export const metadata: Metadata = {
    title: "記録する",
};

export default function RecordPage() {
    return <RecordClient />;
}
