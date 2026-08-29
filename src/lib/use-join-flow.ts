import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { emptyRegistration, type RegistrationFiles, type RegistrationValues } from "@/components/RegistrationForm";
import { chooseOnboardingRole, fetchStaffAccess, type OnboardingRole } from "@/lib/onboarding";
import {
  clearDraft,
  loadDraft,
  loadDraftFiles,
  missingRequiredFiles,
  saveDraftFiles,
  saveDraftValues,
} from "@/lib/onboarding-draft";

type FlowState = "loading" | "form" | "finishing" | "done";

/**
 * Step 2 of the sign-up wizard, shared by the three public role forms.
 *
 * - Signed-out visitor: the form's action is "Next" — answers are cached as a
 *   draft and the visitor continues to the credentials step.
 * - Signed-in user returning from step 3 (email sign-up or Google): the cached
 *   draft is submitted automatically, so nothing is ever re-typed.
 */
export function useJoinFlow(role: OnboardingRole, submit: (v: RegistrationValues, files: RegistrationFiles) => Promise<string | null>) {
  const navigate = useNavigate();
  const submitRef = useRef(submit);
  submitRef.current = submit;

  const [state, setState] = useState<FlowState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [initial, setInitial] = useState<RegistrationValues>(emptyRegistration);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const draft = loadDraft();
      const draftValues = draft && draft.role === role ? draft.values : null;

      if (!user) {
        if (!active) return;
        setInitial(draftValues ?? emptyRegistration);
        setState("form");
        return;
      }

      // Back office staff never fill in a public role form.
      if ((await fetchStaffAccess(user.id)).isStaff) {
        navigate({ to: "/backoffice", replace: true });
        return;
      }
      if (!active) return;
      setUserId(user.id);

      const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
      const prefilled: RegistrationValues = {
        ...emptyRegistration,
        ...(draftValues ?? {}),
        email: draftValues?.email || user.email || "",
        full_name: draftValues?.full_name || meta?.full_name || meta?.name || "",
      };
      setInitial(prefilled);

      if (!draftValues) {
        setState("form");
        return;
      }

      // Finalise the draft captured before the account existed.
      setState("finishing");
      const files = await loadDraftFiles();
      const fileProblem = missingRequiredFiles(role, files);
      if (fileProblem) {
        if (!active) return;
        setError(fileProblem);
        setState("form");
        return;
      }
      await chooseOnboardingRole(user.id, role);
      const err = await submitRef.current(prefilled, files);
      if (!active) return;
      if (err) {
        setError(err);
        setState("form");
        return;
      }
      await clearDraft();
      if (active) setState("done");
    })().catch(() => {
      if (active) setState("form");
    });

    return () => {
      active = false;
    };
  }, [role, navigate]);

  async function onSubmit(values: RegistrationValues, files: RegistrationFiles): Promise<string | null> {
    setError(null);

    // Signed out: cache and move on to the credentials step.
    if (!userId) {
      const fileProblem = missingRequiredFiles(role, files);
      if (fileProblem) return fileProblem;
      saveDraftValues(role, values);
      await saveDraftFiles(files);
      navigate({ to: "/join/credentials" });
      return null;
    }

    const err = await submitRef.current(values, files);
    if (err) return err;
    await clearDraft();
    setState("done");
    return null;
  }

  return {
    state,
    userId,
    initial,
    error,
    onSubmit,
    submitLabel: userId ? "Submit" : "Next →",
  };
}
