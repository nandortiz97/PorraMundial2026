import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
};

if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
  console.warn(
    "Supabase: NEXT_PUBLIC_SUPABASE_URL o ANON_KEY no configurados. " +
    "Crea .env.local con los valores de tu proyecto."
  );
}

export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl! : "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Predictions ─────────────────────────────────────────────────────────────

/**
 * Matches the real DB schema exactly:
 *   user_id (uuid PK) | match_id (text PK) | goals_a (int4) | goals_b (int4)
 *   team_a (text)     | team_b (text)
 */
export interface PredictionRow {
  user_id: string;
  match_id: string;
  goals_a: number;   // int4 — never null
  goals_b: number;   // int4 — never null
  team_a: string;    // text — never null
  team_b: string;    // text — never null
}

/** Fetch all saved predictions for a user. */
export async function loadPredictions(userId: string): Promise<PredictionRow[]> {
  const { data, error } = await supabase
    .from("predictions")
    .select("match_id, goals_a, goals_b, team_a, team_b")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map(row => ({ ...row, user_id: userId })) as PredictionRow[];
}

/**
 * Upsert a batch of predictions for a user.
 * Uses .select() after upsert to confirm how many rows were actually written.
 * Conflict target: (user_id, match_id).
 */
export async function savePredictions(
  userId: string,
  rows: Omit<PredictionRow, "user_id">[]
): Promise<void> {
  if (rows.length === 0) return;

  const payload = rows.map(r => ({
    user_id: userId,
    match_id: r.match_id,
    goals_a: r.goals_a,
    goals_b: r.goals_b,
    team_a: r.team_a,
    team_b: r.team_b,
  }));

  const { data, error } = await supabase
    .from("predictions")
    .upsert(payload, { onConflict: "user_id,match_id" })
    .select("match_id");

  if (error) throw new Error(error.message);

  const written = data?.length ?? 0;
  console.log(`[savePredictions] ${written}/${rows.length} filas escritas.`);
  if (written === 0) {
    throw new Error(
      `El upsert no escribió ninguna fila. Verifica que los match_id (${rows.slice(0, 3).map(r => r.match_id).join(", ")}…) ` +
      `existan en la tabla matches y que la FK predictions_match_id_fkey esté satisfecha.`
    );
  }
}

/** Calls the Supabase RPC function `get_leaderboard` and returns the ranked rows. */
export async function getLeaderboard(): Promise<any[]> {
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Fetch every prediction row (all users). Used for live classification. */
export async function loadAllPredictions(): Promise<{
  user_id: string;
  match_id: string;
  goals_a: number | null;
  goals_b: number | null;
}[]> {
  const { data, error } = await supabase
    .from("predictions")
    .select("user_id, match_id, goals_a, goals_b");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Fetch matches that already have official goals entered by admin. */
export async function loadOfficialResults(): Promise<{
  id: string;
  goals_a: number;
  goals_b: number;
}[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, goals_a, goals_b")
    .not("goals_a", "is", null)
    .not("goals_b", "is", null);
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; goals_a: number; goals_b: number }[];
}

// ─── Payment status ──────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "review" | "confirmed";

/** Ensure a profile row exists for this user (upsert on first login). */
export async function ensureProfile(userId: string): Promise<void> {
  await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
}

/** Return the current user's payment_status (defaults to 'pending' if no row). */
export async function getMyPaymentStatus(userId: string): Promise<PaymentStatus> {
  const { data, error } = await supabase
    .from("profiles")
    .select("payment_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.payment_status as PaymentStatus) ?? "pending";
}

/** Admin only: return all profiles with id + payment_status. */
export async function getAllProfiles(): Promise<{ id: string; payment_status: PaymentStatus }[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, payment_status");
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; payment_status: PaymentStatus }[];
}

/** Admin only: set a user's payment_status. */
export async function updatePaymentStatus(userId: string, status: PaymentStatus): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ payment_status: status })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

/**
 * Admin-only: update official match results.
 *
 * Strategy: fetch full existing rows first → merge new goals → upsert complete rows.
 * This avoids NOT NULL violations (phase_id, team_a, team_b, etc.) because
 * the payload always includes every column as it already exists in the DB.
 */
export async function saveOfficialResults(
  results: { id: string; goals_a: number | null; goals_b: number | null }[]
): Promise<void> {
  if (results.length === 0) return;

  const ids = results.map(r => r.id);

  // Step 1 — fetch complete existing rows to preserve all NOT NULL columns
  const { data: existing, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .in("id", ids);

  if (fetchError) throw new Error(fetchError.message);

  if (!existing || existing.length === 0) {
    throw new Error(
      `No se encontraron partidos en la BD para los IDs: ${ids.slice(0, 5).join(", ")}. ` +
      `Comprueba que el formato del ID en el frontend (ej. "m1") coincida exactamente con ` +
      `el valor de la columna id (tipo text) en la tabla matches.`
    );
  }

  // Step 2 — merge: replace goals_a/goals_b, keep every other column intact
  const payload = existing.map(row => {
    const update = results.find(r => r.id === row.id);
    return {
      ...row,
      goals_a: update?.goals_a ?? row.goals_a,
      goals_b: update?.goals_b ?? row.goals_b,
    };
  });

  // Step 3 — upsert with full rows; no constraint violations possible
  const { data: upserted, error: upsertError } = await supabase
    .from("matches")
    .upsert(payload, { onConflict: "id" })
    .select("id");

  if (upsertError) throw new Error(upsertError.message);

  const written = upserted?.length ?? 0;
  console.log(
    `[saveOfficialResults] ${written}/${ids.length} partidos actualizados:`,
    upserted?.map(r => r.id)
  );
  if (written === 0) {
    throw new Error(`El upsert no modificó ninguna fila. IDs enviados: ${ids.join(", ")}`);
  }
}
