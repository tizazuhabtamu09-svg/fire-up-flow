import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileRow } from "@/lib/onboarding";
import { uploadFile } from "@/lib/uploads";
import { RegistrationForm, type RegistrationValues, type RegistrationFiles } from "@/components/RegistrationForm";
import { useJoinFlow } from "@/lib/use-join-flow";
import { Steps } from "@/routes/join.credentials";

export const Route = createFileRoute("/join/employee")({
  head: () => ({
    meta: [
      { title: "Join as Employee — Agaze/አጋዝ" },
      { name: "description", content: "Register as a worker on Agaze. Provide your details, Fayda ID, and sector to get hired." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmployeeJoin,
});

function EmployeeJoin() {
  async function submit(v: RegistrationValues, files: RegistrationFiles): Promise<string | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return "Your session expired. Please sign in again.";
    const email = v.email;
    if (!files.idFront || !files.idBack) return "Please upload both sides of your Fayda ID.";
    try {
      const [frontPath, backPath, photoPath, contractPath, guarantorIdPath, guarantorPhotoPath, educationPath] = await Promise.all([
        uploadFile("id-documents", userId, "front", files.idFront),
        uploadFile("id-documents", userId, "back", files.idBack),
        files.photo ? uploadFile("avatars", userId, "profile", files.photo) : Promise.resolve(null),
        files.contract ? uploadFile("id-documents", userId, "contract", files.contract) : Promise.resolve(null),
        files.guarantorId ? uploadFile("id-documents", userId, "guarantor-id", files.guarantorId) : Promise.resolve(null),
        files.guarantorPhoto ? uploadFile("id-documents", userId, "guarantor-photo", files.guarantorPhoto) : Promise.resolve(null),
        files.educationDoc ? uploadFile("id-documents", userId, "education", files.educationDoc) : Promise.resolve(null),
      ]);

      const { data: app, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: userId,
          role: "employee",
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
          longitude: v.longitude,
          sector: v.sector as never,
          sector_other: v.sector_other || null,
          sectors: v.sectors ?? [],
        })
        .select()
        .single();
      if (appErr) throw appErr;

      const { error: profErr } = await supabase.from("employee_profiles").insert({
        application_id: app.id,
        user_id: userId,
        fayda_number: v.fayda_number,
        id_photo_front: frontPath,
        id_photo_back: backPath,
        photo_url: photoPath,
        contract_path: contractPath,
        guarantor_name: v.guarantor_name || null,
        guarantor_phone: v.guarantor_phone || null,
        guarantor_id_number: v.guarantor_id_number || null,
        guarantor_id_photo: guarantorIdPath,
        guarantor_photo: guarantorPhotoPath,
        experience: v.experience,
        education: v.education || null,
        education_institution: v.has_education ? v.education_institution || null : null,
        education_qualification: v.has_education ? v.education_qualification || null : null,
        education_graduation_year: v.has_education && v.education_graduation_year ? parseInt(v.education_graduation_year, 10) : null,
        education_document: educationPath,
        gender: v.gender ? (v.gender as never) : null,
        age: v.age ? parseInt(v.age, 10) : null,
        sector: v.sector as never,
        sector_other: v.sector_other || null,
        sectors: v.sectors ?? [],
        language: v.language || null,
        language_other: v.language_other || null,
        skills: v.skills ?? [],
      });
      if (profErr) throw profErr;

      // Also list the worker publicly so employers (and the nearby map) can find them.
      await supabase.from("workers").insert({
        owner_id: userId,
        user_id: userId,
        full_name: v.full_name,
        email: v.email || email,
        phone: v.phone || null,
        sector: v.sector as never,
        sector_other: v.sector_other || null,
        sectors: v.sectors ?? [],
        language: v.language || null,
        language_other: v.language_other || null,
        skills: v.skills ?? [],
        city: v.city || null,
        area: v.sub_city || null,
        address: v.address || null,
        sub_city: v.sub_city || null,
        wereda: v.wereda || null,
        kebele: v.kebele || null,
        experience: v.experience || null,
        education: v.education || null,
        education_institution: v.has_education ? v.education_institution || null : null,
        education_qualification: v.has_education ? v.education_qualification || null : null,
        education_graduation_year: v.has_education && v.education_graduation_year ? parseInt(v.education_graduation_year, 10) : null,
        education_document: educationPath,
        gender: v.gender ? (v.gender as never) : null,
        age: v.age ? Number(v.age) : null,
        price: v.price ? Number(v.price) : null,
        photo_url: photoPath,
        fayda_number: v.fayda_number,
        fayda_front: frontPath,
        fayda_back: backPath,
        contract_path: contractPath,
        guarantor_name: v.guarantor_name || null,
        guarantor_phone: v.guarantor_phone || null,
        guarantor_id_number: v.guarantor_id_number || null,
        guarantor_id_photo: guarantorIdPath,
        guarantor_photo: guarantorPhotoPath,
        latitude: v.latitude,
        longitude: v.longitude,
        available: v.available,
        registration_type: "self",
        registered_by: userId,
        registered_by_name: v.full_name,
      });

      await ensureProfileRow(userId);
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

  const flow = useJoinFlow("employee", submit);

  if (flow.state === "loading" || flow.state === "finishing") {
    return (
      <div className="container-page py-24 text-center text-muted-foreground">
        {flow.state === "finishing" ? "Finishing your registration…" : "Loading…"}
      </div>
    );
  }

  if (flow.state === "done") {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg card-soft p-10 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-2xl font-bold">Application submitted</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you! We'll review your details and verify your Fayda ID. You'll hear from us soon.
          </p>
          <Link to="/dashboard" className="btn-brand mt-6 inline-block">Go to my dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <Steps current={2} />
        <div className="mb-6">
          <Link to="/join" className="text-sm text-muted-foreground hover:text-foreground">← Choose different role</Link>
          <h1 className="mt-2 text-3xl font-bold">Join as Employee</h1>
          <p className="font-amharic text-muted-foreground">እንደ ሰራተኛ ይመዝገቡ</p>
        </div>

        {!flow.userId && (
          <p className="mb-4 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
            Fill in your details, then choose how you'll sign in on the next step. Nothing is lost along the way.
          </p>
        )}
        {flow.error && <p className="mb-4 text-sm text-destructive">{flow.error}</p>}

        <RegistrationForm
          variant="employee"
          initial={flow.initial}
          submitLabel={flow.userId ? "Submit application" : flow.submitLabel}
          showAvailability
          onSubmit={flow.onSubmit}
        />
      </div>
    </div>
  );
}
