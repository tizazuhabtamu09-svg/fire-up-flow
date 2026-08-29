// Flattens the client build into dist/ (root index.html) for Apache/Plesk.
// Usage: STATIC_SPA=1 vite build && node scripts/static-dist.mjs
import { cp, rm, access, mkdir, readdir, rename, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const client = resolve(dist, "client");
const out = dist;

await access(resolve(client, "index.html")).catch(() => {
  console.error("dist/client/index.html is missing. Run `npm run build:static`.");
  process.exit(1);
});

// The SSR bundle is useless on static hosting.
await rm(resolve(dist, "server"), { recursive: true, force: true });
// Move dist/client/* up into dist/ so index.html sits at the root.
const staged = resolve(root, ".static-stage");
await rm(staged, { recursive: true, force: true });
await rename(client, staged);
for (const entry of await readdir(dist)) {
  await rm(resolve(dist, entry), { recursive: true, force: true });
}
await mkdir(out, { recursive: true });
await cp(staged, out, { recursive: true });
await rm(staged, { recursive: true, force: true });
// Vite skips dotfiles in public/, so copy the Apache rewrite rules explicitly.
await cp(resolve(root, "public/.htaccess"), resolve(out, ".htaccess"));

// Ensure every local asset reference is relative so the build works from any
// document root (domain root or subfolder) without path rewriting.
const indexPath = resolve(out, "index.html");
let html = await readFile(indexPath, "utf8");
html = html
  .replaceAll('href="/./assets/', 'href="./assets/')
  .replaceAll('src="/./assets/', 'src="./assets/')
  .replaceAll('href="/favicon.ico"', 'href="./favicon.ico"');
await writeFile(indexPath, html);

console.log("Static site ready in dist/ — upload its contents to httpdocs/");
