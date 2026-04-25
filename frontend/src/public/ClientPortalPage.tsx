import { FileCheck, FileText, MessageSquare, Clock, ExternalLink } from "lucide-react";
import { useParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { useCollectionList } from "../hooks/useCollection";

type PortalData = {
  client_name: string;
  accountant_name: string;
  firm_name: string;
  contracts: Array<{ id: number; title: string; status: string; deadline: string; sign_url?: string }>;
  documents: Array<{ id: number; name: string; size: number; uploaded_at: string }>;
  messages: Array<{ id: number; from: string; content: string; created_at: string }>;
};

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const portal = useCollectionList<PortalData>("portal", `/portal/${token}/overview`);
  const data = portal.data as unknown as PortalData | undefined;

  if (portal.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Link invalid</h1>
          <p className="text-muted-foreground">Acest link de portal nu este valid sau a expirat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-frame">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Portal Client</p>
          <h1 className="text-2xl font-bold">{data.client_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contabil: <strong>{data.accountant_name}</strong> · {data.firm_name}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Contracts */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-[color:var(--accent)]" />
            <h2 className="text-lg font-semibold">Contracte</h2>
            <Badge variant="neutral">{data.contracts.length}</Badge>
          </div>
          <div className="space-y-2">
            {data.contracts.map((c) => (
              <article key={c.id} className="rounded-xl border border-border bg-frame p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Deadline: {new Date(c.deadline).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={c.status === "signed" ? "success" : c.status === "expired" ? "danger" : "warning"}>
                    {c.status}
                  </Badge>
                  {c.sign_url && (
                    <a href={c.sign_url} className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--accent)] hover:underline">
                      <ExternalLink className="w-3 h-3" /> Semnează
                    </a>
                  )}
                </div>
              </article>
            ))}
            {data.contracts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Niciun contract activ.</p>
            )}
          </div>
        </section>

        {/* Documents */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Documente partajate</h2>
            <Badge variant="neutral">{data.documents.length}</Badge>
          </div>
          <div className="space-y-2">
            {data.documents.map((d) => (
              <article key={d.id} className="rounded-xl border border-border bg-frame p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{d.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{fmtSize(d.size)}</span>
                  <span>{new Date(d.uploaded_at).toLocaleDateString("ro-RO")}</span>
                </div>
              </article>
            ))}
            {data.documents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Niciun document partajat.</p>
            )}
          </div>
        </section>

        {/* Messages */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Mesaje</h2>
            <Badge variant="neutral">{data.messages.length}</Badge>
          </div>
          <div className="space-y-2">
            {data.messages.map((m) => (
              <article key={m.id} className="rounded-xl border border-border bg-frame p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{m.from}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("ro-RO")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{m.content}</p>
              </article>
            ))}
            {data.messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Niciun mesaj.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>ContApp — Portal securizat</p>
      </footer>
    </div>
  );
}
