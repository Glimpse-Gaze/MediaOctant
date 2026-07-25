import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getFormsForSimilarity } from "@/lib/forms";
import { layoutOctant, nearestNeighbors } from "@/lib/similarity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neighborsOf = searchParams.get("neighborsOf");

  const forms = await getFormsForSimilarity();

  if (neighborsOf) {
    return NextResponse.json({
      neighbors: nearestNeighbors(neighborsOf, forms, 5),
    });
  }

  const octant = layoutOctant(forms);
  return NextResponse.json({
    ...octant,
    admin: await isAdminAuthenticated(),
  });
}
