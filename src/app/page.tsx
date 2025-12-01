import Dashboard, { DashboardInitialData, StudyRecord, Comment, Goal } from "@/components/Dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "タイムライン",
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function buildDashboardInitialData(
  supabase: SupabaseServerClient,
  userId: string,
  userEmail: string | null,
): Promise<DashboardInitialData> {
  // First batch: Get basic data with joins
  const [
    { data: followsData },
    { data: recordsData },
    { data: goalsData },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId),
    supabase
      .from("study_records")
      .select("*, profiles(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("goals")
      .select("*, profiles(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const followingIds = followsData?.map((f) => f.following_id) || [];
  const records = recordsData ?? [];

  const materialNames = [...new Set(records.map((r) => r.subject))];

  // Second batch: Get enrichment data (materials only)
  const { data: materialsData } = materialNames.length
    ? await supabase.from("materials").select("name, image").in("name", materialNames)
    : { data: [] };

  const materialImageMap = new Map(
    (materialsData as { name: string; image: string | null }[] | null)?.map((m) => [m.name, m.image]) || [],
  );

  const enrichedRecords: StudyRecord[] = records.map((record: any) => ({
    ...record,
    material_image: materialImageMap.get(record.subject) || null,
    user_display_name: record.profiles?.display_name || null,
    user_avatar_url: record.profiles?.avatar_url || null,
  }));

  const enrichedGoals: Goal[] = (goalsData || []).map((goal: any) => ({
    ...goal,
    user_display_name: goal.profiles?.display_name || null,
    user_avatar_url: goal.profiles?.avatar_url || null,
  }));

  return {
    userEmail,
    currentUserId: userId,
    followingIds,
    records: enrichedRecords,
    comments: {},
    goals: enrichedGoals,
  };
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialData = await buildDashboardInitialData(supabase, user.id, user.email ?? null);

  return (
    <div className="h-full w-full">
      <Dashboard readOnly initialData={initialData} />
    </div>
  );
}
