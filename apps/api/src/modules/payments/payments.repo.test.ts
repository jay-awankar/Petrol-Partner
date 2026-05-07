import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/pool", () => ({
  dbQuery: vi.fn(),
}));

import { dbQuery } from "../../db/pool";
import * as paymentsRepo from "./payments.repo";

describe("payments.repo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads booking payment status with payment-order updated timestamp diagnostics", async () => {
    vi.mocked(dbQuery).mockResolvedValue({
      rows: [
        {
          booking_id: "booking-1",
          booking_status: "completed",
          booking_payment_state: "verification_pending",
          settlement_id: "settlement-1",
          settlement_status: "due",
          preferred_payment_method: "online",
          total_due_paise: 8800,
          paid_amount_paise: 0,
          due_at: "2026-05-06T09:00:00.000Z",
          payer_user_id: "user-1",
          payee_user_id: "user-2",
          current_user_role: "payer",
          payment_order_id: "payment-order-1",
          provider_order_id: "order_1",
          payment_order_status: "attempted",
          payment_order_amount_paise: 8800,
          payment_order_currency: "INR",
          payment_order_expires_at: null,
          payment_order_updated_at: "2026-05-06T09:10:00.000Z",
          payment_attempt_count: "2",
          payment_attempt_id: "attempt-1",
          provider_payment_id: "pay_1",
          payment_attempt_status: "client_verified",
          payment_attempt_updated_at: "2026-05-06T09:11:00.000Z",
        },
      ],
    } as any);

    const result = await paymentsRepo.findPaymentStatusByBookingIdForUser("booking-1", "user-1");

    expect(result?.reconcile).toEqual({
      payment_order_updated_at: "2026-05-06T09:10:00.000Z",
      payment_attempt_count: 2,
    });

    const [queryText] = vi.mocked(dbQuery).mock.calls[0]!;
    expect(queryText).toContain("po.updated_at AS payment_order_updated_at");
    expect(queryText).toContain("expires_at,");
    expect(queryText).toContain("updated_at");
  });
});
