import { useQuery } from "@tanstack/react-query";
import { Database, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { queryClient } from "../../lib/queryClient";

interface MockHealthResponse {
  status: string;
  message: string;
  version: string;
}

interface MockSummary {
  ok: boolean;
  counts: {
    clients?: number;
    invites?: number;
    tickets?: number;
  };
}

async function pingMock(): Promise<MockSummary> {
  try {
    const [health, clients, invites, tickets] = await Promise.all([
      api.get<MockHealthResponse>("/health"),
      api.get<unknown[]>("/clients"),
      api.get<unknown[]>("/contracts/invites"),
      api.get<unknown[]>("/ticketing/tickets"),
    ]);
    return {
      ok: health?.status === "active",
      counts: {
        clients: Array.isArray(clients) ? clients.length : 0,
        invites: Array.isArray(invites) ? invites.length : 0,
        tickets: Array.isArray(tickets) ? tickets.length : 0,
      },
    };
  } catch {
    return { ok: false, counts: {} };
  }
}

export function MockHealthPill() {
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["mock-health"],
    queryFn: pingMock,
    staleTime: 30_000,
  });

  const handleReset = () => {
    queryClient.clear();
    void refetch();
  };

  if (!data) {
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border border-border text-muted-foreground">
        <Database className="w-3 h-3" /> mock…
      </span>
    );
  }

  if (!data.ok) {
    return (
      <button
        type="button"
        onClick={handleReset}
        className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-600"
      >
        <Database className="w-3 h-3" /> mock down
      </button>
    );
  }

  const total = (data.counts.clients ?? 0) +
    (data.counts.invites ?? 0) +
    (data.counts.tickets ?? 0);

  return (
    <button
      type="button"
      onClick={handleReset}
      title="Click pentru a re-executa toate query-urile"
      className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/15 text-foreground"
    >
      <Database className="w-3 h-3" />
      Mock · {data.counts.clients}c · {data.counts.invites}i · {data.counts.tickets}t
      {isFetching && <RefreshCw className="w-3 h-3 animate-spin" />}
      <span className="sr-only">{total} entries total</span>
    </button>
  );
}
