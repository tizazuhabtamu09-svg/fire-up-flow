import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/uploads";
import { RegistrationForm, type RegistrationValues, type RegistrationFiles } from "@/components/RegistrationForm";
import { useJoinFlow } from "@/lib/use-join-flow";
import { Steps } from "@/routes/join.credentials";

export const Route = createFileRoute("/join/employer")({
  head: () => ({
    meta: [
      { title: "Join as Employer — Agaze/አጋዝ" },
      { name: "description", content: "Hire trusted workers on Agaze. Register as an employer." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmployerJoin,
});

function EmployerJoin() {
  async function submit(v: RegistrationValues, files: RegistrationFiles): Promise<string | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return "Your session expired. Please sign in again.";
    const email = v.email;
    try {
      const [frontPath, backPath, photoPath] = await Promise.all([
        files.idFront ? uploadFile("id-documents", userId, "front", files.idFront) : Promise.resolve(null),
        files.idBack ? uploadFile("id-documents", userId, "back", files.idBack) : Promise.resolve(null),
        files.photo ? uploadFile("avatars", userId, "profile", files.photo) : Promise.resolve(null),
      ]);

      const { error } = await supabase.from("applications").insert({
        user_id: userId,
        role: "employer",
        full_name: v.full_name,
        email: v.email || email,
        phone: v.phone || null,
        address: v.address,
        city: v.city,
        sub_city: v.sub_city,
        wereda: v.wereda,
        kebele: v.kebele,
        fayda_number: v.fayda_number || null,
        fayda_front: frontPath,
        fayda_back: backPath,
        personal_photo: photoPath,
        latitude: v.latitude,
        longitude: v.longitude,
      });
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({
          ...(photoPath ? { avatar_url: photoPath } : {}),
          registration_type: "self",
          registered_by: userId,
          registered_by_name: v.full_name,
        })
        .eq("id", userId);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Something went wrong";
    }
  }

  const flow = useJoinFlow("employer", submit);

  if (flow.state === "loading" || flow.state === "finishing") {
    return (
      <div className="container-page py-24 text-center text-muted-foreground">
        {flow.state === "finishing" ? "Finishing your registration…" : "Loading…"}
      </div>
    );
  }

  if (flow.state === "done")
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg card-soft p-10 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-2xl font-bold">You're registered</h1>
          <p className="mt-2 text-muted-foreground">Start browsing workers near you.</p>
          <Link to="/dashboard" className="btn-brand mt-6 inline-block">Go to my dashboard</Link>
        </div>
      </div>
    );

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <Steps current={2} />
        <Link to="/join" className="text-sm text-muted-foreground hover:text-foreground">← Choose different role</Link>
        <h1 className="mt-2 text-3xl font-bold">Join as Employer</h1>
        <p className="font-amharic text-muted-foreground">እንደ ቀጣሪ ይመዝገቡ</p>
        {flow.error && <p className="mt-4 text-sm text-destructive">{flow.error}</p>}

        <div className="mt-6">
          <RegistrationForm
            variant="employer"
            initial={flow.initial}
            submitLabel={flow.userId ? "Register" : flow.submitLabel}
            onSubmit={flow.onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
