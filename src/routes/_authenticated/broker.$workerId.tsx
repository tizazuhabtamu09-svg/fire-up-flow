import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkerForm, toFormValues, type WorkerRow, type WorkerFormValues } from "@/components/WorkerForm";

export const Route = createFileRoute("/_authenticated/broker/$workerId")({
  head: () => ({
    meta: [
      { title: "Edit employee — Agaze/አጋዝ" },
      { name: "description", content: "Update the details, pricing and availability of an employee under your broker account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditEmployeePage,
});

function EditEmployeePage() {
  const { workerId } = Route.useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<WorkerFormValues | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    supabase
      .from("workers")
      .select("*")
      .eq("id", workerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setInitial(toFormValues(data as WorkerRow));
        else setMissing(true);
      });
  }, [workerId]);

  if (missing) return <p className="text-muted-foreground">Employee not found.</p>;
  if (!initial) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Edit employee info</h1>
      <p className="font-amharic text-muted-foreground">የሰራተኛ መረጃ አስተካክል</p>

      <div className="mt-6">
        <WorkerForm
          initial={initial}
          submitLabel="Save changes"
          onSubmit={async (v) => {
            const { error } = await supabase
              .from("workers")
              .update({
                full_name: v.full_name.trim(),
                phone: v.phone || null,
                sector: v.sector as never,
                sector_other: v.sector_other || null,
                language: v.language || null,
                language_other: v.language_other || null,
                city: v.city || null,
                area: v.area || null,
                experience: v.experience || null,
                gender: v.gender ? (v.gender as never) : null,
                age: v.age ? Number(v.age) : null,
                price: v.price ? Number(v.price) : null,
                available: v.available,
              })
              .eq("id", workerId);
            if (error) return error.message;
            navigate({ to: "/broker" });
            return null;
          }}
        />
      </div>
    </div>
  );
}
