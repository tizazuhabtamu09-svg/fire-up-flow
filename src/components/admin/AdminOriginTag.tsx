import { useEffect, useState } from "react";
import { getRegistrationOrigin, type OriginInfo } from "@/lib/origin.functions";
import { RegistrationOrigin } from "@/components/admin/RegistrationOrigin";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches registration origin metadata for a single record and renders it.
 * The server function returns nothing unless the viewer is a full Admin, so
 * this component silently renders nothing for everybody else.
 */
export function AdminOriginTag({ table, id }: { table: "workers" | "profiles"; id: string }) {
  const [origin, setOrigin] = useState<OriginInfo>(null);

  useEffect(() => {
    let active = true;
    // Only signed-in viewers may call the protected server function; calling it
    // without a session throws "session expired" and breaks the page.
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (active) setOrigin(null);
          return;
        }
        const o = await getRegistrationOrigin({ data: { table, id } });
        if (active) setOrigin(o);
      } catch {
        if (active) setOrigin(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [table, id]);

  if (!origin) return null;
  return <RegistrationOrigin isAdmin type={origin.type} byName={origin.byName} />;
}
