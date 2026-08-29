import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Signs profile photos stored in the private `avatars` bucket so they can be
 * rendered on public employee cards. Only avatar paths are ever signed.
 */
export const signAvatars = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const parsed = z
      .object({ paths: z.array(z.string().min(1)).max(60) })
      .safeParse(data);
    return parsed.success ? parsed.data : { paths: [] as string[] };
  })
  .handler(async ({ data }) => {
    const out: Record<string, string> = {};
    if (data.paths.length === 0) return out;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed, error } = await supabaseAdmin.storage
        .from("avatars")
        .createSignedUrls(data.paths, 3600);
      if (error) {
        console.error("[signAvatars]", error);
        return out;
      }
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
      }
    } catch (err) {
      // Missing service-role config or storage outage must never blank the page.
      console.error("[signAvatars]", err);
    }
    return out;
  });
