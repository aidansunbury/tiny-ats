import { appRouter } from "@/server/api/root";
import { renderTrpcPanel } from "@metamorph/trpc-panel";
import { NextResponse } from "next/server";

// Todo ensure that this can only be accessed in dev mode
export async function GET(req: Request) {
    return new NextResponse(
        renderTrpcPanel(appRouter, {
            url: "/api/trpc",
            transformer: "superjson",
        }),
        {
            status: 200,
            headers: [["Content-Type", "text/html"] as [string, string]],
        },
    );
}
