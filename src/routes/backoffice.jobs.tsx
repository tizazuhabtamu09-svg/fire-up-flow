import { createFileRoute } from "@tanstack/react-router";
import { JobApprovals } from "@/components/admin/JobApprovals";
import { useStaff } from "@/components/backoffice/context";

export const Route = createFileRoute("/backoffice/jobs")({
  component: BackOfficeJobs,
});

function BackOfficeJobs() {
  const staff = useStaff();
  return (
    <div>
      <h1 className="text-2xl font-bold">Job posts</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Approve or reject paid employer job listings, and close jobs that are filled or breach the rules.
      </p>
      <div className="mt-6">
        <JobApprovals reviewerId={staff.userId} />
      </div>
    </div>
  );
}
