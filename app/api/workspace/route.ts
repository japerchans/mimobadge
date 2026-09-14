import { getSession } from "@/lib/auth";
import { transaction, storageMode } from "@/db/repository";
import { expireTranscripts } from "@/domain/workflow";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  try {
    const state = await transaction(session.facilityId, (state) => {
      expireTranscripts(state);
      return state;
    });
    return Response.json(
      { ...state, session, storage: storageMode() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error(
      "Workspace unavailable",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      {
        error:
          "Storage unavailable. Check the database configuration and migration.",
      },
      { status: 503 },
    );
  }
}
