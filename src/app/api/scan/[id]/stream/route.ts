import { getScan } from "@/lib/scan-store";
import { guard } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = guard(request);
  if (denied) return denied;
  const scan = await getScan((await params).id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });
  let timer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;
  const encoder = new TextEncoder();
  const stop = () => {
    stopped = true;
    if (timer) clearInterval(timer);
    request.signal.removeEventListener("abort", stop);
  };
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        if (stopped) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(scan)}\n\n`),
          );
          if (scan.status !== "running") {
            stop();
            controller.close();
          }
        } catch {
          stop();
        }
      };
      request.signal.addEventListener("abort", stop, { once: true });
      timer = setInterval(send, 750);
      send();
    },
    cancel() {
      stop();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
