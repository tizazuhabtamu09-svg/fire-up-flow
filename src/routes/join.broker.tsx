import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileRow } from "@/lib/onboarding";
import { uploadFile } from "@/lib/uploads";
import { RegistrationForm, type RegistrationValues, type RegistrationFiles } from "@/components/RegistrationForm";
import { useJoinFlow } from "@/lib/use-join-flow";
import { Steps } from "@/routes/join.credentials";

export const Route = createFileRoute("/join/broker")({
  head: () => ({
    meta: [
    { title: "Join as Broker — Agaze/አጋዝ" },
    { name: "description", content: "Connect workers and employers on Agaze. Register as a broker." },
    { name: "robots", content: "noindex" }]

  }),
  component: BrokerJoin
});

function BrokerJoin() {const { t } = useLanguage();
  async function submit(v: RegistrationValues, files: RegistrationFiles): Promise<string | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return "Your session expired. Please sign in again.";
    const email = v.email;
    if (!files.idFront || !files.idBack) return "Please upload both sides of your Fayda ID.";
    try {
      const [frontPath, backPath, photoPath] = await Promise.all([
      uploadFile("id-documents", userId, "broker-front", files.idFront),
      uploadFile("id-documents", userId, "broker-back", files.idBack),
      files.photo ? uploadFile("avatars", userId, "broker-photo", files.photo) : Promise.resolve(null)]
      );
      const { error } = await supabase.from("applications").insert({
        user_id: userId,
        role: "broker",
        full_name: v.full_name,
        email: v.email || email,
        phone: v.phone || null,
        address: v.address,
        city: v.city,
        sub_city: v.sub_city,
        wereda: v.wereda,
        kebele: v.kebele,
        fayda_number: v.fayda_number,
        fayda_front: frontPath,
        fayda_back: backPath,
        personal_photo: photoPath,
        latitude: v.latitude,
        longitude: v.longitude
      });
      if (error) throw error;
      await ensureProfileRow(userId);
      await supabase.
      from("profiles").
      update({
        ...(photoPath ? { avatar_url: photoPath } : {}),
        registration_type: "self",
        registered_by: userId,
        registered_by_name: v.full_name
      }).
      eq("id", userId);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Something went wrong";
    }
  }

  const flow = useJoinFlow("broker", submit);

  if (flow.state === "loading" || flow.state === "finishing") {
    return (
      <div className="container-page py-24 text-center text-muted-foreground">
        {flow.state === "finishing" ? "Finishing your registration…" : "Loading…"}
      </div>);

  }

  if (flow.state === "done")
  return (
    <div className="container-page py-16">
        <div className="mx-auto max-w-lg card-soft p-10 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-2xl font-bold">{t("ui.application.submitted")}</h1>
          <p className="mt-2 text-muted-foreground">{t("ui.we.ll.be.in.touch.to.activate.your.broker.account")}</p>
          <Link to="/dashboard" className="btn-brand mt-6 inline-block">{t("ui.go.to.my.dashboard")}</Link>
        </div>
      </div>);


  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <Steps current={2} />
        <Link to="/join" className="text-sm text-muted-foreground hover:text-foreground">{t("ui.choose.different.role")}</Link>
        <h1 className="mt-2 text-3xl font-bold">{t("ui.join.as.broker")}</h1>
        <p className="font-amharic text-muted-foreground">እንደ ደላላ ይመዝገቡ</p>
        {flow.error && <p className="mt-4 text-sm text-destructive">{flow.error}</p>}

        <div className="mt-6">
          <RegistrationForm
            variant="broker"
            initial={flow.initial}
            submitLabel={flow.userId ? "Submit application" : flow.submitLabel}
            onSubmit={flow.onSubmit} />
          
        </div>
      </div>
    </div>);

}
