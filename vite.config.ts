// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

// `STATIC_SPA=1 npm run build` (npm run build:static) produces a fully
// client-rendered bundle for Apache/Plesk hosting instead of an SSR server.
const STATIC_SPA = process.env.STATIC_SPA === "1";

// These are public browser connection values, not privileged credentials.
// They MUST match this project's backend: the server validates every session
// token against it, so a stale value makes the browser sign in to a different
// backend and every admin/broker action fails with "session expired".
const PROJECT_BACKEND_URL = "https://ltskydjhjshautyhusnv.supabase.co";
const PROJECT_PUBLISHABLE_KEY = "sb_publishable_WywS3SOXRV5ZxZzkTuiUbQ_fRUtrWQQ";

// Publishable (safe to ship) backend values, resolved from the environment
// only. NEVER hardcode a project URL/key here: a stale fallback silently
// points the published build at a different backend, which shows up as
// "Invalid login credentials" for accounts that exist in this project.
const publicBackendUrl =
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  PROJECT_BACKEND_URL;
const publicBackendKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  PROJECT_PUBLISHABLE_KEY;



export default defineConfig({
  // Static SPA builds have no Node/Worker host, so skip the deploy bundler.
  ...(STATIC_SPA ? { nitro: false as const } : {}),
  vite: {
    // Relative asset paths so the build can be served from any Plesk/Apache
    // document root (or a subfolder) without rewriting URLs.
    base: STATIC_SPA ? "./" : "/",
    // The browser client only reads VITE_* names. Resolve them explicitly so
    // production and preview builds always target this project's backend.
    define: {
      ...(publicBackendUrl
        ? { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBackendUrl) }
        : {}),
      ...(publicBackendKey
        ? {
            "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY":
              JSON.stringify(publicBackendKey),
            "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(publicBackendKey),
          }
        : {}),
    },
  },

  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Static hosting: render everything in the browser and emit a populated
    // index.html shell that Apache can serve for every route.
    ...(STATIC_SPA
      ? {
          spa: {
            enabled: true,
            prerender: { outputPath: "/index.html", crawlLinks: false },
          },
        }
      : {}),
  },
});
