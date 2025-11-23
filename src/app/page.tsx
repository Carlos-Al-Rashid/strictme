import AIFeedback from "@/components/AIFeedback";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Top Half: AI Feedback */}
      <div className="h-[45%] w-full relative z-10">
        <AIFeedback />
      </div>

      {/* Bottom Half: Dashboard */}
      <div className="h-[60%] w-full relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[3rem] overflow-hidden -mt-8 bg-white">
        <Dashboard readOnly={true} />
      </div>
    </div>
  );
}
