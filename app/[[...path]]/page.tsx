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
  const residentTabRoute =
    path[0] === "residents" &&
    path.length === 3 &&
    ["records", "profile", "family"].includes(path[2]);
  const residentDailyReviewRoute =
    path[0] === "residents" &&
    path.length === 4 &&
    path[2] === "review" &&
    /^\d{4}-\d{2}-\d{2}$/.test(path[3]);
  if (
    (path.length > 2 && !residentTabRoute && !residentDailyReviewRoute) ||
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
