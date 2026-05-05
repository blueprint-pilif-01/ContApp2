import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bold,
  Bot,
  FileText,
  Heading1,
  Italic,
  List,
  MessageSquarePlus,
  Paperclip,
  Search,
  Send,
  Sparkles,
  Type,
  Underline,
  X,
} from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import { AIResultCard, AIShimmerText, AIThinkingBlob } from "../../../components/ai";
import { Button } from "../../../components/ui/Button";
import { useCollectionCreate, useCollectionList } from "../../../hooks/useCollection";
import { useExtensions } from "../../../hooks/useExtensions";
import { usePrincipal } from "../../../hooks/useMe";
import { useToast } from "../../../components/ui/Toast";
import { api } from "../../../lib/api";
import { deriveTicket } from "../../../lib/ai";
import { fmtRelative, cn } from "../../../lib/utils";
import { MessageTemplates } from "./MessageTemplates";

type Conversation = {
  id: number;
  type: "direct" | "group" | "client";
  title: string;
  unread_count: number;
  last_message: string;
  updated_at: string;
};

type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
  is_bot: boolean;
};

type ChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
};

const MESSAGE_RENDER_BATCH = 120;
const CONVERSATION_RENDER_BATCH = 80;

function stripHtml(content: string): string {
  return content
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(content: string): string {
  return content
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMessageHtml(content: string): string {
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  return escapeHtml(content).replaceAll("\n", "<br />");
}

export default function ChatPage() {
  const ext = useExtensions();
  const toast = useToast();
  const principal = usePrincipal("user");
  const myMembershipId = principal?.kind === "user" ? principal.membership_id : null;
  const aiAvailable = ext.canUse("ai_assistant");
  const conversations = useCollectionList<Conversation>(
    "chat-conversations",
    "/chat/conversations"
  );
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("3");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [composerDragOver, setComposerDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [botBusy, setBotBusy] = useState(false);
  const [botDraft, setBotDraft] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [visibleMessageCount, setVisibleMessageCount] = useState(MESSAGE_RENDER_BATCH);
  const [conversationLimit, setConversationLimit] = useState(CONVERSATION_RENDER_BATCH);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeId && conversations.data?.length) {
      setActiveId(conversations.data[0]?.id ?? null);
    }
  }, [activeId, conversations.data]);

  useEffect(() => {
    setVisibleMessageCount(MESSAGE_RENDER_BATCH);
  }, [activeId]);

  useEffect(() => {
    setConversationLimit(CONVERSATION_RENDER_BATCH);
  }, [query]);

  const messages = useCollectionList<Message>(
    "chat-messages",
    activeId
      ? `/chat/conversations/${activeId}/messages`
      : "/chat/conversations/0/messages",
    "",
    activeId !== null
  );

  const send = useCollectionCreate<{ content: string }, Message>(
    "chat-messages",
    activeId
      ? `/chat/conversations/${activeId}/messages`
      : "/chat/conversations/0/messages"
  );

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.data, botDraft, confirmation]);

  const active = useMemo(
    () => conversations.data?.find((c) => c.id === activeId) ?? null,
    [conversations.data, activeId]
  );

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = conversations.data ?? [];
    if (!q) return rows;
    return rows.filter((c) =>
      `${c.title} ${c.last_message}`.toLowerCase().includes(q)
    );
  }, [conversations.data, query]);

  const visibleConversations = filteredConversations.slice(0, conversationLimit);
  const hiddenConversations = Math.max(0, filteredConversations.length - visibleConversations.length);
  const allMessages = messages.data ?? [];
  const hiddenMessages = Math.max(0, allMessages.length - visibleMessageCount);
  const visibleMessages = allMessages.slice(hiddenMessages);

  const focusComposer = () => composerRef.current?.focus();
  const clearComposer = () => {
    setDraft("");
    if (composerRef.current) composerRef.current.innerHTML = "";
  };

  const triggerBot = async () => {
    const plain = stripHtml(draft);
    if (!plain.trim()) return;
    if (!activeId) {
      toast.error("Selectează o conversație înainte de a crea un ticket din chat.");
      return;
    }
    if (!aiAvailable) {
      toast.error("AI Assistant nu este activ. Activează-l din Setări → Abonament.");
      return;
    }
    setBotBusy(true);
    setConfirmation(null);
    let latest = "";
    for await (const chunk of deriveTicket(plain)) {
      latest = chunk;
      setBotDraft(chunk);
    }
    const result = await api.post<{
      ticket: { id: number; title: string };
      confirmation: string;
    }>("/chat/derive-ticket", { message: plain });
    await send.mutateAsync({ content: `@bot ${latest}` });
    setConfirmation(result.confirmation || `Am creat ticketul #${result.ticket.id}.`);
    setBotBusy(false);
    clearComposer();
    setAttachments([]);
  };

  const runCommand = (command: string, value?: string) => {
    focusComposer();
    document.execCommand(command, false, value);
    setDraft(composerRef.current?.innerHTML ?? "");
  };

  const pushFiles = (files: File[]) => {
    if (files.length === 0) return;
    const nextFiles = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setAttachments((current) => [...current, ...nextFiles]);
    focusComposer();
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (!reader.result || typeof reader.result !== "string") return;
          const dataUrl = reader.result;
          setAttachments((current) =>
            current.map((item) =>
              item.id.startsWith(`${file.name}-${file.size}`) && !item.dataUrl
                ? { ...item, dataUrl }
                : item
            )
          );
          runCommand("insertImage", dataUrl);
        };
        reader.readAsDataURL(file);
      } else {
        runCommand("insertText", ` [Attachment: ${file.name}] `);
      }
    }
  };

  const handleSend = async () => {
    const plain = stripHtml(draft);
    if (!plain.trim() && attachments.length === 0) return;
    if (!activeId) {
      toast.error("Selectează o conversație înainte de trimitere.");
      return;
    }
    if (plain.trim().toLowerCase().startsWith("@bot")) {
      await triggerBot();
      return;
    }
    const attachmentBlock =
      attachments.length > 0
        ? `<p><strong>Attachments:</strong> ${attachments
            .map((file) => escapeHtml(file.name))
            .join(", ")}</p>`
        : "";
    const payload = `${draft || escapeHtml(plain)}${attachmentBlock}`;
    await send.mutateAsync({ content: payload });
    clearComposer();
    setAttachments([]);
  };

  const totalUnread = (conversations.data ?? []).reduce(
    (acc, c) => acc + c.unread_count,
    0
  );

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[300px_1fr] rounded-2xl border border-border bg-frame overflow-hidden"
      style={{ height: "calc(100dvh - 8rem)", minHeight: 520 }}
    >
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="border-r border-border bg-frame flex flex-col min-h-0">
        <div className="px-3 py-3 border-b border-border space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold tracking-tight">Conversații</p>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-foreground text-background">
                  {totalUnread}
                </span>
              )}
            </div>
            <Button
              size="xs"
              variant="outline"
              disabled
              title="Backend-ul expune momentan lista și mesajele, nu crearea de conversații."
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută conversație..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredConversations.length === 0 ? (
            <p className="text-xs text-muted-foreground p-6 text-center">
              Nicio conversație.
            </p>
          ) : (
            <ul className="p-1">
              {visibleConversations.map((c) => {
                const selected = activeId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "w-full text-left rounded-lg p-2.5 transition-colors flex items-center gap-2.5",
                        selected
                          ? "bg-foreground/8 text-foreground"
                          : "hover:bg-foreground/5"
                      )}
                    >
                      <Avatar name={c.title} size="sm" status="online" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{c.title}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {fmtRelative(c.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.last_message}
                          </p>
                          {c.unread_count > 0 && !selected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[color:var(--accent)] text-foreground shrink-0">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
              {hiddenConversations > 0 && (
                <li className="p-1">
                  <Button
                    size="xs"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setConversationLimit((v) => v + CONVERSATION_RENDER_BATCH)}
                  >
                    Arată încă {Math.min(hiddenConversations, CONVERSATION_RENDER_BATCH)}
                  </Button>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between shrink-0 bg-frame">
          <span
            className={cn(
              "inline-flex items-center gap-1",
              !aiAvailable && "opacity-60"
            )}
            title={
              aiAvailable
                ? "Scrie @bot ... pentru a deriva un ticket"
                : "Necesită AI Assistant"
            }
          >
            <Bot className="w-3 h-3 text-foreground/70" />
            {aiAvailable ? "@bot disponibil" : "@bot blocat"}
          </span>
          <span>{(conversations.data ?? []).length} total</span>
        </div>
      </aside>

      {/* ── Main chat ─────────────────────────────────────── */}
      <section className="bg-background flex flex-col min-h-0 relative">
        {active ? (
          <>
            <header className="px-6 py-3 border-b border-border bg-frame flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={active.title} size="sm" status="online" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{active.title}</p>
                  <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                    {active.type === "direct"
                      ? "Mesaj direct"
                      : active.type === "group"
                        ? "Grup"
                        : "Conversație client"}
                    · online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-foreground/8 text-foreground border border-border">
                  <Bot className="w-3 h-3" /> @bot
                </span>
              </div>
            </header>

            <div ref={scrollerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-3 min-h-0">
              {allMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-10">
                  Începe conversația. Scrie un mesaj sau folosește @bot pentru a crea un ticket.
                </p>
              )}
              {hiddenMessages > 0 && (
                <div className="flex justify-center">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setVisibleMessageCount((v) => v + MESSAGE_RENDER_BATCH)}
                  >
                    Încarcă {Math.min(hiddenMessages, MESSAGE_RENDER_BATCH)} mesaje mai vechi
                  </Button>
                </div>
              )}
              {visibleMessages.map((m) => {
                const senderName =
                  m.sender_name?.trim() ||
                  (myMembershipId && m.sender_id === myMembershipId
                    ? "Tu"
                    : `User #${m.sender_id}`);
                const mine = Boolean(
                  (myMembershipId && m.sender_id === myMembershipId) ||
                    senderName.toLowerCase() === "tu"
                );
                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-end gap-2 max-w-[80%]",
                      mine ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <Avatar name={senderName} size="xs" />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[10px] uppercase tracking-wider mb-1 text-muted-foreground",
                          mine ? "text-right" : ""
                        )}
                      >
                        {senderName}
                      </p>
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                          mine
                            ? "bg-foreground text-background"
                            : "bg-foreground/6 text-foreground"
                        )}
                        dangerouslySetInnerHTML={{ __html: renderMessageHtml(m.content) }}
                      />
                      <p
                        className={cn(
                          "text-[10px] text-muted-foreground mt-1",
                          mine ? "text-right" : ""
                        )}
                      >
                        {fmtRelative(m.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {botBusy && (
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground rounded-full px-3 py-1.5 bg-foreground/5 w-fit">
                  <AIThinkingBlob /> Botul pregătește ticketul...
                </div>
              )}

              {(botDraft || confirmation) && (
                <div className="max-w-[90%]">
                  <AIResultCard
                    loading={botBusy}
                    onCopy={() => navigator.clipboard.writeText(botDraft)}
                    onRegenerate={triggerBot}
                    onDismiss={() => {
                      setBotDraft("");
                      setConfirmation(null);
                    }}
                  >
                    <AIShimmerText
                      active={botBusy}
                      text={botDraft || "Botul s-a oprit."}
                      className="text-sm text-foreground"
                    />
                    {confirmation && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-[color:var(--accent)]" />
                        {confirmation}
                      </div>
                    )}
                  </AIResultCard>
                </div>
              )}
            </div>

            <footer className="border-t border-border bg-frame px-4 py-3 shrink-0">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-2">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-frame px-2 py-1">
                    <Type className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value);
                        runCommand("fontName", e.target.value);
                      }}
                      className="bg-transparent text-xs outline-none"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times</option>
                      <option value="Courier New">Courier</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <select
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(e.target.value);
                      runCommand("fontSize", e.target.value);
                    }}
                    className="rounded-lg border border-border bg-frame px-2 py-1 text-xs outline-none"
                  >
                    <option value="2">Small</option>
                    <option value="3">Normal</option>
                    <option value="4">Large</option>
                    <option value="5">XL</option>
                  </select>
                  <Button size="xs" variant="ghost" onClick={() => runCommand("bold")} title="Bold">
                    <Bold className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => runCommand("italic")} title="Italic">
                    <Italic className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => runCommand("underline")} title="Underline">
                    <Underline className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => runCommand("formatBlock", "<h1>")} title="Heading 1">
                    <Heading1 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => runCommand("insertUnorderedList")} title="Listă">
                    <List className="w-3.5 h-3.5" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      pushFiles(Array.from(e.target.files ?? []));
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button size="xs" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-3.5 h-3.5" /> Attachments
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => setTemplatesOpen(true)}>
                    <FileText className="w-3.5 h-3.5" /> Șabloane
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <div
                    className={cn(
                      "flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-accent/40",
                      composerDragOver && "border-[color:var(--accent)] bg-[color:var(--accent)]/8"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setComposerDragOver(true);
                    }}
                    onDragLeave={() => setComposerDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setComposerDragOver(false);
                      pushFiles(Array.from(e.dataTransfer.files ?? []));
                    }}
                  >
                    <div
                      ref={composerRef}
                      contentEditable
                      suppressContentEditableWarning
                      dir="ltr"
                      style={{ direction: "ltr", unicodeBidi: "plaintext" }}
                      onInput={(e) => setDraft((e.target as HTMLDivElement).innerHTML)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      data-placeholder="Scrie un mesaj... sau @bot creează ticket din asta"
                      className="min-h-[40px] max-h-[180px] overflow-y-auto outline-none [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-muted-foreground"
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    loading={send.isPending}
                    disabled={!activeId}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file) => (
                      <span
                        key={file.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
                      >
                        <Paperclip className="w-3 h-3" />
                        {file.name}
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((current) => current.filter((item) => item.id !== file.id))
                          }
                          className="rounded-full p-0.5 hover:bg-foreground/10"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 inline-flex items-center gap-1">
                <Bot className="w-3 h-3" /> Tip: scrie{" "}
                <code className="px-1 py-0.5 rounded bg-foreground/5">@bot</code>{" "}
                pentru a deriva un ticket.
              </p>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10 text-sm text-muted-foreground">
            Selectează o conversație din stânga.
          </div>
        )}
      </section>
      <MessageTemplates
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onInsert={(content) => {
          setDraft(content);
          if (composerRef.current) composerRef.current.innerHTML = content;
        }}
      />
    </div>
  );
}
