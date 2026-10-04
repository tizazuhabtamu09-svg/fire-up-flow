import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useSession, useRoleFlags } from "@/lib/use-session";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
    { title: "Admin console — Agaze/አጋዝ" },
    { name: "description", content: "Agaze admin console: users, verification, documents, pricing and accounts." },
    { name: "robots", content: "noindex" }]

  }),
  component: AdminLayout
});

const ADMIN_LINKS: {to: string;label: string;exact?: boolean;}[] = [
{ to: "/admin", label: "Overview", exact: true },
{ to: "/admin/users", label: "Users" },
{ to: "/admin/verification", label: "Verification" },
{ to: "/admin/documents", label: "Documents" },
{ to: "/admin/profile-changes", label: "Document review" },
{ to: "/admin/sectors", label: "Sectors" },
{ to: "/admin/pricing", label: "Pricing" },
{ to: "/admin/accounts", label: "Create accounts" },
{ to: "/admin/sub-admins", label: "Sub-admins" },
{ to: "/admin/workers", label: "Workers" },
{ to: "/admin/roster", label: "Candidate roster" },
{ to: "/admin/assignments", label: "Assignments" },
{ to: "/admin/bookings", label: "Bookings" },
{ to: "/admin/requests", label: "Employee requests" },
{ to: "/admin/jobs", label: "Job posts" },
{ to: "/admin/banners", label: "Posting (banners)" },
{ to: "/admin/compliance", label: "Compliance logs" },
{ to: "/admin/messages", label: "Messages" },
{ to: "/admin/payments", label: "Payments" }];


const KYC_LINKS: {to: string;label: string;exact?: boolean;}[] = [
{ to: "/admin/verification", label: "Verification" },
{ to: "/admin/documents", label: "Documents" },
{ to: "/admin/profile-changes", label: "Document review" },
{ to: "/admin/requests", label: "Employee requests" },
{ to: "/admin/jobs", label: "Job posts" },
{ to: "/admin/compliance", label: "Compliance logs" }];


function AdminLayout() {const { t } = useLanguage();
  const { user } = useSession();
  const { isAdmin, isKyc, loading } = useRoleFlags(user?.id);

  if (loading) return <p className="text-muted-foreground">{t("ui.checking.permissions")}</p>;

  if (!isAdmin && !isKyc) {
    return (
      <div className="card-soft p-10 text-center">
        <h1 className="text-2xl font-bold">{t("ui.staff.only")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("ui.you.don.t.have.permission.to.view.this.page")}</p>
      </div>);

  }

  const links = isAdmin ? ADMIN_LINKS : KYC_LINKS;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{isAdmin ? "Admin console" : "KYC console"}</h1>
          <p className="font-amharic text-muted-foreground">
            {isAdmin ? "የአስተዳዳሪ ማዕከል" : "የሰነድ ማረጋገጫ ማዕከል"}
          </p>
        </div>
      </div>

      <nav className="mt-6 flex gap-2 overflow-x-auto rounded-full bg-secondary p-1 text-sm font-semibold">
        {links.map((l) =>
        <Link
          key={l.to}
          to={l.to}
          activeOptions={{ exact: Boolean(l.exact) }}
          className="whitespace-nowrap rounded-full px-4 py-2 text-muted-foreground transition hover:text-foreground data-[status=active]:bg-card data-[status=active]:text-foreground data-[status=active]:shadow-sm">
          
            {l.label}
          </Link>
        )}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>);

}
