import { createServiceClient } from "@/lib/supabase/server";

export const revalidate = 60;

async function getLeaderboard() {
  const supabase = await createServiceClient();

  const [{ data: anon }] = await Promise.all([
    supabase
      .from("anonymous_students")
      .select("id, display_name, total_points")
      .order("total_points", { ascending: false })
      .limit(20),
  ]);

  return (anon ?? []).map((s, idx) => ({
    rank: idx + 1,
    display_name: s.display_name,
    total_points: s.total_points,
  }));
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No scores yet. Scan a QR code to be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={[
                "flex items-center gap-4 px-4 py-3 rounded-lg border",
                entry.rank <= 3 ? "bg-muted/50" : "",
              ].join(" ")}
            >
              <span className="w-8 text-center font-bold tabular-nums">
                {medals[entry.rank] ?? entry.rank}
              </span>
              <span className="flex-1 font-medium">{entry.display_name}</span>
              <span className="tabular-nums font-semibold text-primary">
                {entry.total_points} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
