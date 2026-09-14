import { getSession, sameOrigin } from "@/lib/auth";
import { transaction } from "@/db/repository";
import { actionSchema, executeAction, DomainError } from "@/domain/workflow";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const session = await getSession();
  if (!session)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (Number(request.headers.get("content-length") || 0) > 100000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  try {
    const raw = await request.text();
    if (raw.length > 100000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const parsed = actionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return Response.json(
        { error: "Check the submitted fields." },
        { status: 400 },
      );
    const result = await transaction(session.facilityId, (state) =>
      executeAction(state, parsed.data, session),
    );
    return Response.json(result);
  } catch (error) {
    if (error instanceof DomainError)
      return Response.json({ error: error.message }, { status: error.status });
    return Response.json(
      { error: "Could not save changes. Please try again." },
      { status: 500 },
    );
  }
}
