import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ChangeRequest = Database["public"]["Tables"]["profile_change_requests"]["Row"];
export type ChangeTarget = "workers" | "broker_employers";

export type EditableField = { key: string; label: string; type?: "text" | "number" };

/** A broker-submitted update sits in this state until admin/KYC decides. */
export const UNDER_REVIEW = "under_review";

export const isUnderReview = (status: string) => status === UNDER_REVIEW || status === "pending";

export const changeStatusLabel = (status: string) =>
  isUnderReview(status) ? "Under Document Review" : status === "approved" ? "Approved" : "Declined";

/** Registration fields a broker may ask to correct, per record type. */
export const EDITABLE_FIELDS: Record<ChangeTarget, EditableField[]> = {
  workers: [
    { key: "full_name", label: "Full name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "E-mail" },
    { key: "age", label: "Age", type: "number" },
    { key: "experience", label: "Experience" },
    { key: "price", label: "Expected rate (per month)", type: "number" },
    { key: "city", label: "City" },
    { key: "sub_city", label: "Sub city" },
    { key: "wereda", label: "Wereda" },
    { key: "kebele", label: "Kebele" },
    { key: "area", label: "Area" },
    { key: "address", label: "Address" },
    { key: "fayda_number", label: "Fayda number" },
    { key: "guarantor_name", label: "Guarantor name" },
    { key: "guarantor_phone", label: "Guarantor phone" },
    { key: "guarantor_id_number", label: "Guarantor ID number" },
    { key: "language", label: "Language" },
    { key: "language_other", label: "Language (other)" },
  ],
  broker_employers: [
    { key: "full_name", label: "Full name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "E-mail" },
    { key: "city", label: "City" },
    { key: "sub_city", label: "Sub city" },
    { key: "wereda", label: "Wereda" },
    { key: "kebele", label: "Kebele" },
    { key: "address", label: "Address" },
    { key: "fayda_number", label: "Fayda number" },
  ],
};

export type DocSlot = { key: string; label: string; bucket: string };

/** Registration documents captured for each record type. */
export const DOC_SLOTS: Record<ChangeTarget, DocSlot[]> = {
  workers: [
    { key: "photo_url", label: "Profile photo", bucket: "avatars" },
    { key: "fayda_front", label: "Fayda ID — front", bucket: "id-documents" },
    { key: "fayda_back", label: "Fayda ID — back", bucket: "id-documents" },
    { key: "guarantor_photo", label: "Guarantor photo", bucket: "avatars" },
    { key: "guarantor_id_photo", label: "Guarantor ID", bucket: "id-documents" },
    { key: "contract_path", label: "Contract", bucket: "id-documents" },
  ],
  broker_employers: [
    { key: "personal_photo", label: "Personal photo", bucket: "avatars" },
    { key: "fayda_front", label: "Fayda ID — front", bucket: "id-documents" },
    { key: "fayda_back", label: "Fayda ID — back", bucket: "id-documents" },
  ],
};

export const fieldLabel = (target: ChangeTarget, key: string) =>
  EDITABLE_FIELDS[target].find((f) => f.key === key)?.label ??
  DOC_SLOTS[target].find((d) => d.key === key)?.label ??
  key;

export async function submitChangeRequest(input: {
  target: ChangeTarget;
  targetId: string;
  targetName: string;
  requestedBy: string;
  requesterName: string | null;
  changes: Record<string, string | number | null>;
  note: string | null;
}) {
  const { error } = await supabase.from("profile_change_requests").insert({
    target_table: input.target,
    target_id: input.targetId,
    target_name: input.targetName,
    requested_by: input.requestedBy,
    requester_name: input.requesterName,
    changes: input.changes,
    note: input.note,
    status: UNDER_REVIEW,
  });
  if (error) throw error;
}

export async function loadChangeRequestsFor(targetId: string) {
  const { data } = await supabase
    .from("profile_change_requests")
    .select("*")
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function loadAllChangeRequests() {
  const { data } = await supabase
    .from("profile_change_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function reviewChangeRequest(id: string, approve: boolean, note: string) {
  const { error } = await supabase.rpc("review_profile_change", {
    _id: id,
    _approve: approve,
    _note: note,
  });
  if (error) throw error;
}
