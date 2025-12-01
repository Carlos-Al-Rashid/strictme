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
  // First batch: Get basic data
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
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const followingIds = followsData?.map((f) => f.following_id) || [];
  const records = recordsData ?? [];

  const materialNames = [...new Set(records.map((r) => r.subject))];
  const recordUserIds = [...new Set(records.map((r) => r.user_id))];
  const goalUserIds = [...new Set((goalsData || []).map((g) => g.user_id))];
  const allUserIds = [...new Set([...recordUserIds, ...goalUserIds])];

  // Second batch: Get enrichment data (materials and profiles) in parallel
  const [materialsRes, profilesRes] = await Promise.all([
    materialNames.length
      ? supabase.from("materials").select("name, image").in("name", materialNames)
      : Promise.resolve({ data: [], error: null }),
    allUserIds.length
      ? supabase.from("profiles").select("id, display_name, avatar_url").in("id", allUserIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const materialsData = materialsRes.data || [];
  const profilesData = profilesRes.data || [];

  const materialImageMap = new Map(
    (materialsData as { name: string; image: string | null }[]).map((m) => [m.name, m.image])
  );
  const userNameMap = new Map(
    (profilesData as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name])
  );
  const userAvatarMap = new Map(
    (profilesData as { id: string; avatar_url: string | null }[]).map((p) => [p.id, p.avatar_url])
  );

  const enrichedRecords: StudyRecord[] = records.map((record) => ({
    ...record,
    material_image: materialImageMap.get(record.subject) || null,
    user_display_name: userNameMap.get(record.user_id) || null,
    user_avatar_url: userAvatarMap.get(record.user_id) || null,
  }));

  const enrichedGoals: Goal[] = (goalsData || []).map((goal) => ({
    ...goal,
    user_display_name: userNameMap.get(goal.user_id) || null,
    user_avatar_url: userAvatarMap.get(goal.user_id) || null,
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
