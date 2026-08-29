import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile, useRoleFlags } from "@/lib/use-session";
import { ChangePassword } from "@/components/ChangePassword";
import { fetchOnboardingStatus, joinPathForRole } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "in" | "out">("checking");
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState(session ? "in" : "out");
    });
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state === "out") navigate({ to: "/auth", replace: true });
  }, [state, navigate]);

  // Nobody reaches the app until they picked a role and submitted its form.
  useEffect(() => {
    if (state !== "in") return;
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || !active) return;
      const status = await fetchOnboardingStatus(data.user.id);
      if (!active) return;
      if (status.state === "staff") navigate({ to: "/backoffice", replace: true });
      else if (status.state === "complete") setOnboarded(true);
      else if (status.state === "needs-form") navigate({ to: joinPathForRole[status.role], replace: true });

      else navigate({ to: "/onboarding", replace: true });
    });
    return () => {
      active = false;
    };
  }, [state, navigate]);

  if (state !== "in" || !onboarded) {
    return <div className="container-page py-24 text-center text-muted-foreground">Loading…</div>;
  }

  return <AuthenticatedShell />;
}


function AuthenticatedShell() {
  const { user } = useSession();
  const { profile, setProfile } = useProfile(user?.id);

  if (profile?.must_change_password) {
    return (
      <div className="container-page mx-auto max-w-lg py-16">
        <h1 className="text-2xl font-bold">Set your own password</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Your account was created by an administrator with a temporary password. Choose a new one to continue.
        </p>
        <ChangePassword
          confirmRequired={false}
          requireCurrent
          currentLabel="Current temporary password"
          title="Create a new password"
          description="Enter the temporary password you were given, then choose your own."
          onDone={() => setProfile({ ...profile, must_change_password: false })}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <AccountNav />
      <Outlet />
    </div>
  );
}

function AccountNav() {
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  const { isAdmin, isKyc } = useRoleFlags(user?.id);

  const links: { to: string; label: string }[] = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/bookings", label: "Bookings" },
    { to: "/messages", label: "Messages" },
  ];
  if (profile?.role === "broker") {
    links.push({ to: "/broker", label: "My Employees" });
  }
  if (profile?.role === "employee") links.push({ to: "/my-employer", label: "My Employer" });
  links.push({ to: "/profile", label: "Profile" });
  if (profile?.role === "employee") links.push({ to: "/update-profile", label: "Update Profile" });


  if (isAdmin) links.push({ to: "/admin", label: "Admin" });
  else if (isKyc) links.push({ to: "/admin/verification", label: "Verification" });

  return (
    <nav className="mb-8 flex gap-2 overflow-x-auto rounded-full bg-secondary p-1 text-sm font-semibold">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="whitespace-nowrap rounded-full px-4 py-2 text-muted-foreground transition data-[status=active]:bg-card data-[status=active]:text-foreground data-[status=active]:shadow-sm"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
