import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { WorkspaceApp } from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  if (!(await getSession())) redirect("/login");
  const { path = [] } = await params;
  if (
    path.length > 2 ||
    (path[0] &&
      ![
        "dashboard",
        "processing",
        "residents",
        "records",
        "handoffs",
        "family",
        "staff",
        "settings",
      ].includes(path[0]))
  )
    notFound();
  return <WorkspaceApp />;
}
