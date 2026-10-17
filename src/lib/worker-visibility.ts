/** Public discovery is independent of the viewer's private owner/staff access. */
export function isPubliclyVisibleWorker(worker: {
  verification_status?: string | null;
  available?: boolean | null;
}): boolean {
  return worker.verification_status === "approved" && worker.available === true;
}