import Dashboard from "@/components/Dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "タイムライン",
};

export default function Home() {
  return <Dashboard />;
}
