import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { IncidentReports } from "@/components/admin/IncidentReports";
import { TerminationRequests } from "@/components/admin/TerminationRequests";
import { EmployeeReports } from "@/components/admin/EmployeeReports";
import { EmployeeTerminations } from "@/components/admin/EmployeeTerminations";
import { ComplianceLogs } from "@/components/admin/ComplianceLogs";
import { useStaff } from "@/components/backoffice/context";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/backoffice/compliance")({
  component: BackofficeCompliance
});

function BackofficeCompliance() {
  const staff = useStaff();
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
    <AdminSection
        title={t("back.compliance.incidentsTitle")}
        description={t("back.compliance.incidentsDescription")}>
        
      <IncidentReports />
    </AdminSection>

    <AdminSection
        title={t("back.compliance.terminationTitle")}
        description={t("back.compliance.terminationDescription")}>
        
      <TerminationRequests viewerId={staff.userId} />
    </AdminSection>

    <AdminSection
        title={t("ui.employee.reports")}
        description="Reports filed by employees against their employer, with any evidence they attached.">
        
      <EmployeeReports />
    </AdminSection>

    <AdminSection
        title={t("ui.employee.terminations")}
        description="Termination requests filed by employees, pending employer acknowledgement or back-office decision.">
        
      <EmployeeTerminations />
    </AdminSection>

    <AdminSection
        title={t("ui.compliance.logs")}
        description="Read-only audit trail of profile updates, reports and termination decisions.">
        
      <ComplianceLogs />
    </AdminSection>
    </div>);

}
