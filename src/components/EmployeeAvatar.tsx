import { User } from "lucide-react";

/** Real profile photo of a registered employee, with a neutral fallback. */
export function EmployeeAvatar({
  photoUrl,
  name,
  className = "h-12 w-12 rounded-2xl",
}: {
  photoUrl: string | null;
  name: string;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${name} profile photo`}
        loading="lazy"
        className={`shrink-0 object-cover ${className}`}
        style={{ background: "var(--brand-soft)" }}
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${className}`}
      style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
      aria-label={`${name} has no profile photo`}
    >
      <User className="h-1/2 w-1/2" />
    </span>
  );
}
