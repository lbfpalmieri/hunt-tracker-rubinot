import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/errors";
import { fmtDate } from "@/lib/format";
import { Bug, Lightbulb, MessageSquare, Send, Inbox, Loader2, Download, History, ChevronDown } from "lucide-react";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({
    meta: [
      { title: "Sugestões e bugs — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Envie sugestões ou reporte bugs e acompanhe a resposta da equipe do tracker.",
      },
      { property: "og:title", content: "Sugestões e bugs" },
      { property: "og:description", content: "Canal direto para sugestões e reports do RubinOT Hunt Tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackPage,
});

type Kind = "suggestion" | "bug";
type Status = "novo" | "em_analise" | "respondido" | "resolvido";

interface Ticket {
  id: string;
  user_id: string;
  char_name: string | null;
  kind: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  attachment_path?: string | null;
}

function TicketImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.storage
      .from("feedback-attachments")
      .createSignedUrl(path, 3600)
      .then(({ data }) => { if (alive) setUrl(data?.signedUrl ?? null); });
    return () => { alive = false; };
  }, [path]);
  if (!url) return <div className="text-xs text-muted-foreground">Carregando imagem...</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt="Imagem anexada" loading="lazy" className="max-h-80 w-auto rounded-lg border border-border" />
    </a>
  );
}

interface ThreadMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  is_admin: boolean;
  char_name: string | null;
  body: string;
  created_at: string;
}

const STATUS_META: Record<Status, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-rubi-blue-soft text-rubi-blue" },
  em_analise: { label: "Em análise", className: "bg-rubi-gold/20 text-rubi-gold" },
  respondido: { label: "Respondido", className: "bg-emerald-500/15 text-emerald-400" },
  resolvido: { label: "Resolvido", className: "bg-muted text-muted-foreground" },
};

const STATUS_ORDER: Status[] = ["novo", "em_analise", "respondido", "resolvido"];

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[(status as Status) in STATUS_META ? (status as Status) : "novo"];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.className}`}>
      {meta.label}
    </span>
  );
}

// Supabase generated types may not include the new tables yet.
const db = supabase as unknown as {
  from: (table: string) => any;
  auth: typeof supabase.auth;
};

function FeedbackPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const activeCharName = useAppStore((s) => s.characters.find((c) => c.id === s.activeCharacterId)?.name ?? null);
  const [showHistory, setShowHistory] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const [kind, setKind] = useState<Kind>("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [tab, setTab] = useState<"mine" | "inbox">("mine");

  const load = async () => {
    setError(null);
    try {
      const { data: auth } = await db.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const [roles, ticketRows] = await Promise.all([
        db.from("user_roles").select("role").eq("user_id", uid),
        db.from("feedback_tickets").select("*").order("updated_at", { ascending: false }),
      ]);
      if (roles.error) throw roles.error;
      if (ticketRows.error) throw ticketRows.error;

      const admin = (roles.data ?? []).some((r: { role: string }) => r.role === "admin");
      setIsAdmin(admin);
      const list = (ticketRows.data ?? []) as Ticket[];
      setTickets(list);

      if (list.length > 0) {
        const { data: msgs, error: msgErr } = await db
          .from("feedback_messages")
          .select("*")
          .order("created_at", { ascending: true });
        if (msgErr) throw msgErr;
        setMessages((msgs ?? []) as ThreadMessage[]);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mine = useMemo(() => tickets.filter((t) => t.user_id === userId), [tickets, userId]);
  const visible = isAdmin && tab === "inbox" ? tickets : mine;
  const inboxPending = useMemo(
    () => tickets.filter((t) => t.status === "novo").length,
    [tickets],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !subject.trim() || !message.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let attachment_path: string | null = null;
      if (file) {
        if (!file.type.startsWith("image/")) throw new Error("Envie apenas imagens.");
        if (file.size > 5 * 1024 * 1024) throw new Error("A imagem precisa ter até 5 MB.");
        const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("feedback-attachments")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        attachment_path = path;
      }
      const { error: insErr } = await db.from("feedback_tickets").insert({
        user_id: userId,
        char_name: activeCharName,
        kind,
        subject: subject.trim(),
        message: message.trim(),
        attachment_path,
      });
      if (insErr) throw insErr;
      setSubject("");
      setMessage("");
      setFile(null);
      setFileKey((k) => k + 1);
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (ticket: Ticket) => {
    if (!userId || !reply.trim()) return;
    setSendingReply(true);
    setError(null);
    try {
      const { error: msgErr } = await db.from("feedback_messages").insert({
        ticket_id: ticket.id,
        author_id: userId,
        is_admin: isAdmin && ticket.user_id !== userId,
        char_name: activeCharName,
        body: reply.trim(),
      });
      if (msgErr) throw msgErr;
      if (isAdmin && ticket.status !== "resolvido") {
        await db.from("feedback_tickets").update({ status: "respondido" }).eq("id", ticket.id);
      }
      setReply("");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSendingReply(false);
    }
  };

  const changeStatus = async (ticket: Ticket, status: Status) => {
    setError(null);
    try {
      const { error: upErr } = await db.from("feedback_tickets").update({ status }).eq("id", ticket.id);
      if (upErr) throw upErr;
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };


  const activeList = visible.filter((t) => t.status !== "resolvido");
  const historyList = visible.filter((t) => t.status === "resolvido");
  const renderTicket = (t: Ticket) => {
                const thread = messages.filter((m) => m.ticket_id === t.id);
                const open = openId === t.id;
                return (
                  <li key={t.id} className="card-surface overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenId(open ? null : t.id);
                        setReply("");
                      }}
                      className="flex w-full items-start gap-3 p-4 text-left hover:bg-accent/50"
                    >
                      {t.kind === "bug" ? (
                        <Bug className="mt-0.5 h-4 w-4 flex-none text-rubi-danger" />
                      ) : (
                        <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-rubi-gold" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{t.subject}</span>
                          <StatusBadge status={t.status} />
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {fmtDate(t.created_at)}
                          {t.char_name ? ` · ${t.char_name}` : ""}
                          {thread.length > 0 ? ` · ${thread.length} resposta(s)` : ""}
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-border px-4 py-4">
                        <p className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-sm">{t.message}</p>
                        {t.attachment_path && <TicketImage path={t.attachment_path} />}

                        {thread.map((m) => (
                          <div
                            key={m.id}
                            className={
                              "whitespace-pre-wrap rounded-lg p-3 text-sm " +
                              (m.is_admin
                                ? "border border-rubi-gold/40 bg-rubi-gold/10"
                                : "bg-muted/20")
                            }
                          >
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {m.is_admin ? "Resposta da equipe" : m.char_name ?? (m.author_id === userId ? "Você" : "Usuário")} · {fmtDate(m.created_at)}
                            </div>
                            {m.body}
                          </div>
                        ))}

                        {isAdmin && (
                          <div className="flex flex-wrap gap-2">
                            {STATUS_ORDER.map((s) => (
                              <button
                                key={s}
                                onClick={() => changeStatus(t, s)}
                                className={
                                  "min-h-9 rounded-lg border px-2.5 py-1 text-xs font-medium " +
                                  (t.status === s
                                    ? "border-rubi-blue bg-rubi-blue/10 text-rubi-blue"
                                    : "border-border text-muted-foreground hover:bg-accent")
                                }
                              >
                                {STATUS_META[s].label}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            rows={3}
                            maxLength={4000}
                            placeholder={isAdmin ? "Responder..." : "Adicionar mais informações..."}
                            className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm"
                          />
                          <button
                            onClick={() => void sendReply(t)}
                            disabled={sendingReply || !reply.trim()}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rubi-blue px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
  };

  // Exporta tudo em texto estruturado para colar numa IA organizar as melhorias.
  const exportAll = () => {
    const lines: string[] = [
      "# Sugestões e bugs — RubinOT Hunt Tracker",
      `Exportado em ${new Date().toLocaleString("pt-BR")} · ${tickets.length} ticket(s)`,
      "",
    ];
    const sorted = [...tickets].sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const t of sorted) {
      const meta = STATUS_META[(t.status as Status) in STATUS_META ? (t.status as Status) : "novo"];
      lines.push(`## [${t.kind === "bug" ? "BUG" : "SUGESTÃO"}] ${t.subject}`);
      lines.push(`- Status: ${meta.label}`);
      lines.push(`- Personagem: ${t.char_name ?? "sem personagem"}`);
      lines.push(`- Criado: ${fmtDate(t.created_at)} · Atualizado: ${fmtDate(t.updated_at)}`);
      lines.push("");
      lines.push(t.message.trim());
      const thread = messages
        .filter((m) => m.ticket_id === t.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      for (const m of thread) {
        lines.push("");
        lines.push(`> **${m.is_admin ? "Equipe" : m.char_name ?? "Usuário"}** (${fmtDate(m.created_at)}): ${m.body.trim()}`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sugestoes-bugs-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Suporte</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Sugestões e bugs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie uma ideia ou relate um problema. Você acompanha o status aqui mesmo e recebe a resposta na conversa.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-3 text-sm text-rubi-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <form onSubmit={submit} className="card-surface space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-rubi-gold" /> Nova mensagem
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "suggestion" as Kind, label: "Sugestão", icon: Lightbulb },
                { value: "bug" as Kind, label: "Bug", icon: Bug },
              ]
            ).map((opt) => {
              const Icon = opt.icon;
              const active = kind === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition " +
                    (active
                      ? "border-rubi-blue bg-rubi-blue/10 text-rubi-blue"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Assunto</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder="Ex: Erro ao salvar sessão"
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Detalhes</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              rows={6}
              placeholder="Conte o que aconteceu ou o que você gostaria de ver no app."
              className="mt-1 w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Imagem (opcional, até 5 MB)</span>
            <input
              key={fileKey}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-blue hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? "Enviando..." : "Enviar"}
          </button>

          {sent && (
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-400">
              Recebemos sua mensagem! Você verá a resposta aqui.
            </p>
          )}
        </form>

        <div className="space-y-3">
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTab("mine")}
                className={
                  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:flex-none " +
                  (tab === "mine" ? "border-rubi-blue bg-rubi-blue/10 text-rubi-blue" : "border-border text-muted-foreground")
                }
              >
                <MessageSquare className="h-4 w-4" /> Minhas
              </button>
              <button
                onClick={() => setTab("inbox")}
                className={
                  "relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:flex-none " +
                  (tab === "inbox" ? "border-rubi-gold bg-rubi-gold/10 text-rubi-gold" : "border-border text-muted-foreground")
                }
              >
                <Inbox className="h-4 w-4" /> Caixa de entrada
                {inboxPending > 0 && (
                  <span className="rounded-full bg-rubi-gold px-1.5 py-0.5 text-[10px] font-bold text-background">
                    {inboxPending}
                  </span>
                )}
              </button>
              <button
                onClick={exportAll}
                disabled={tickets.length === 0}
                title="Baixa todos os tickets e respostas em um arquivo de texto para colar numa IA"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 sm:flex-none"
              >
                <Download className="h-4 w-4" /> Exportar tudo
              </button>
            </div>
          )}

          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-muted/30" />
          ) : visible.length === 0 ? (
            <div className="card-surface p-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem por aqui ainda.
            </div>
          ) : (
            <>
            <ul className="space-y-2">
              {activeList.length === 0 && (
                <li className="card-surface p-6 text-center text-sm text-muted-foreground">Nenhum ticket em aberto.</li>
              )}
              {activeList.map(renderTicket)}
            </ul>
            {historyList.length > 0 && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  <span className="inline-flex items-center gap-2"><History className="h-4 w-4" /> Histórico de resolvidos ({historyList.length})</span>
                  <ChevronDown className={"h-4 w-4 transition-transform " + (showHistory ? "rotate-180" : "")} />
                </button>
                {showHistory && <ul className="space-y-2 opacity-90">{historyList.map(renderTicket)}</ul>}
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
