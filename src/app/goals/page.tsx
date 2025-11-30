import { Metadata } from "next";
import GoalsClient from "./GoalsClient";

export const metadata: Metadata = {
    title: "レポート",
};

export default function GoalsPage() {
    return <GoalsClient />;
}
