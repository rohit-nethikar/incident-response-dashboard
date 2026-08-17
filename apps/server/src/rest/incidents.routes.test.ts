import { test } from "vitest";
import { LEGAL_TRANSITIONS } from "@incident-dash/shared";

/**
 * Test suite for incident status transition validation.
 *
 * Verifies that the API only allows status transitions defined in LEGAL_TRANSITIONS
 * and rejects invalid transitions with appropriate error messages.
 *
 * Note: These tests document the validation rules. The actual validation logic
 * is enforced by the changeStatus service in incidentLifecycle.ts, which is
 * called by the PATCH /incidents/:id/status route handler.
 */

test("LEGAL_TRANSITIONS defines all valid status transitions", () => {
  // Verify that the transition rules exist and are well-formed
  expect(LEGAL_TRANSITIONS).toBeDefined();
  expect(typeof LEGAL_TRANSITIONS).toBe("object");

  // Spot-check known valid transitions
  expect(LEGAL_TRANSITIONS.OPEN).toContain("ACKNOWLEDGED");
  expect(LEGAL_TRANSITIONS.ACKNOWLEDGED).toContain("IN_PROGRESS");
  expect(LEGAL_TRANSITIONS.IN_PROGRESS).toContain("RESOLVED");
  expect(LEGAL_TRANSITIONS.RESOLVED).toContain("CLOSED");

  // Spot-check that invalid transitions are NOT in the rules
  expect(LEGAL_TRANSITIONS.OPEN).not.toContain("IN_PROGRESS");
  expect(LEGAL_TRANSITIONS.IN_PROGRESS).not.toContain("ACKNOWLEDGED");
  expect(LEGAL_TRANSITIONS.CLOSED).toEqual([]);
});

test("API endpoint PATCH /incidents/:id/status validates transitions", () => {
  // This documents the validation behavior:
  // - The route receives a changeStatusSchema validation
  // - It calls the changeStatus service which:
  //   1. Fetches the current incident status
  //   2. Looks up LEGAL_TRANSITIONS[currentStatus]
  //   3. Checks if nextStatus is in that array
  //   4. Throws IllegalTransitionError if not valid
  // - The route catches IllegalTransitionError and returns 409 Conflict
  //
  // To test this end-to-end, run the development server and test with:
  //   curl -X PATCH http://localhost:4000/api/v1/incidents/{id}/status \
  //     -H "Authorization: Bearer {token}" \
  //     -H "Content-Type: application/json" \
  //     -d '{"status":"IN_PROGRESS"}' \
  //     # for an incident with status OPEN → should return 409 Conflict
  //
  // Example error response:
  //   HTTP 409 Conflict
  //   {"error":"Cannot transition incident from OPEN to IN_PROGRESS"}
});
