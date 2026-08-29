import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/use-session";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FeedbackChat } from "@/components/backoffice/FeedbackChat";
import { loadOwnerMessages, type ReviewMessage } from "@/lib/review-chat";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({
    meta: [
      { title: "Document review chat — Agaze/አጋዝ" },
      { name: "description", content: "Talk to the verification team, fix flagged documents and upload corrected files." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerificationChatPage,
});

function VerificationChatPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  const [messages, setMessages] = useState<ReviewMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setMessages(await loadOwnerMessages(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`review-owner-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "review_messages", filter: `owner_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const target = useMemo(() => {
    const last = messages[messages.length - 1];
    return {
      source: last?.subject_source ?? "profiles",
      subjectId: last?.subject_id ?? user?.id ?? "",
    };
  }, [messages, user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("verif.title")}</h1>
        <VerifiedBadge status={profile?.verification_status ?? "pending"} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("verif.intro")}</p>
      {profile?.verification_note && (
        <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
          <span className="font-semibold">{t("verif.latestNote")} </span>
          {profile.verification_note}
        </p>
      )}

      <div className="card-soft mt-5 p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("verif.loadingConversation")}</p>
        ) : (
          <FeedbackChat
            ownerId={user.id}
            source={target.source}
            subjectId={target.subjectId}
            name={profile?.full_name || t("verif.you")}
            viewerId={user.id}
            asStaff={false}
            messages={messages}
            onSent={load}
          />
        )}
      </div>

      <Link to="/dashboard" className="mt-5 inline-block text-sm font-semibold text-primary">{t("verif.backToDashboard")}</Link>
    </div>
  );
}
