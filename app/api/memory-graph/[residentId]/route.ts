import { getSession } from "@/lib/auth";
import { transaction } from "@/db/repository";
import { memoryGraphForResident } from "@/domain/memory-graph";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ residentId: string }> },
) {
  const session = await getSession();
  const { residentId } = await context.params;
  try {
    const graph = await transaction(session.facilityId, (state) => {
      const resident = state.residents.find((item) => item.id === residentId);
      if (!resident) return null;
      return {
        resident: { id: resident.id, name: resident.name },
        ...memoryGraphForResident(state, residentId),
      };
    });
    if (!graph)
      return Response.json(
        { error: "入居者が見つかりません。" },
        { status: 404 },
      );
    return Response.json(graph, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error(
      "Memory graph unavailable",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "記憶グラフを取得できませんでした。" },
      { status: 503 },
    );
  }
}
