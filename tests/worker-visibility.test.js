import { describe, expect, test } from "bun:test";
import { isPubliclyVisibleWorker } from "../src/lib/worker-visibility.ts";

describe("public worker visibility", () => {
  test("new, pending, and declined workers are hidden even when available", () => {
    for (const verification_status of [undefined, null, "pending", "declined"]) {
      expect(isPubliclyVisibleWorker({ verification_status, available: true })).toBe(false);
    }
  });

  test("approved workers disappear when made unavailable", () => {
    expect(isPubliclyVisibleWorker({ verification_status: "approved", available: false })).toBe(false);
  });

  test("making a worker available restores visibility only after approval", () => {
    expect(isPubliclyVisibleWorker({ verification_status: "approved", available: true })).toBe(true);
    expect(isPubliclyVisibleWorker({ verification_status: "pending", available: true })).toBe(false);
  });
});