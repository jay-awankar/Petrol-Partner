import { beforeEach, describe, expect, it, vi } from "vitest";

const { withTransactionMock } = vi.hoisted(() => ({
  withTransactionMock: vi.fn(),
}));

vi.mock("../../db/transaction", () => ({
  withTransaction: withTransactionMock,
}));

vi.mock("../../queues", () => ({
  cancelSettlementOverdue: vi.fn(async () => undefined),
  scheduleSettlementOverdue: vi.fn(async () => undefined),
}));

vi.mock("../../shared/audit/logs", () => ({
  insertAuditLog: vi.fn(async () => undefined),
}));

vi.mock("../notifications/notifications.service", () => ({
  createInAppNotification: vi.fn(async () => undefined),
}));

vi.mock("../verification/verification.service", () => ({
  assertVerifiedStudentCanTransact: vi.fn(async () => undefined),
}));

vi.mock("./settlements.repo", () => ({
  findSettlementByBookingIdForUpdate: vi.fn(),
  updateSettlement: vi.fn(async () => undefined),
  updateOutstandingBalanceStatus: vi.fn(async () => undefined),
  insertSettlementEvent: vi.fn(async () => undefined),
  findSettlementByBookingIdForUser: vi.fn(),
  getFinancialHoldSummary: vi.fn(async () => ({
    hasHold: false,
    totalOutstandingPaise: 0,
    balances: [],
  })),
}));

import * as queues from "../../queues";
import * as settlementsRepo from "./settlements.repo";
import * as settlementsService from "./settlements.service";

describe("settlements.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withTransactionMock.mockImplementation(async (callback: (client: unknown) => Promise<unknown>) =>
      callback({}),
    );
  });

  it("keeps outstanding balance open when dispute is resolved as reopen_due", async () => {
    vi.mocked(settlementsRepo.findSettlementByBookingIdForUpdate).mockResolvedValue({
      id: "settlement-1",
      booking_id: "booking-1",
      payer_user_id: "user-1",
      payee_user_id: "user-2",
      status: "disputed",
      total_due_paise: 8800,
      metadata: {},
      settled_at: null,
      owner_confirmed_received_at: null,
    } as any);
    vi.mocked(settlementsRepo.findSettlementByBookingIdForUser).mockResolvedValue({
      id: "settlement-1",
      booking_id: "booking-1",
      status: "due",
    } as any);

    await settlementsService.resolveDispute("booking-1", "admin-1", {
      outcome: "reopen_due",
      reason: "needs repayment",
    });

    expect(settlementsRepo.updateSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        settlementId: "settlement-1",
        status: "due",
      }),
      expect.anything(),
    );
    expect(settlementsRepo.updateOutstandingBalanceStatus).toHaveBeenCalledWith(
      "settlement-1",
      "open",
      expect.anything(),
      expect.objectContaining({
        resolvedBy: "admin-1",
        resolution: "reopen_due",
      }),
    );
    expect(queues.scheduleSettlementOverdue).toHaveBeenCalledWith(
      expect.objectContaining({
        settlementId: "settlement-1",
        dueAt: expect.any(Date),
      }),
    );
  });

  it("preserves waived behavior for explicit waived dispute outcomes", async () => {
    vi.mocked(settlementsRepo.findSettlementByBookingIdForUpdate).mockResolvedValue({
      id: "settlement-2",
      booking_id: "booking-2",
      payer_user_id: "user-1",
      payee_user_id: "user-2",
      status: "disputed",
      total_due_paise: 5500,
      metadata: {},
      settled_at: null,
      owner_confirmed_received_at: null,
    } as any);
    vi.mocked(settlementsRepo.findSettlementByBookingIdForUser).mockResolvedValue({
      id: "settlement-2",
      booking_id: "booking-2",
      status: "waived",
    } as any);

    await settlementsService.resolveDispute("booking-2", "admin-1", {
      outcome: "waived",
      reason: "manual waiver",
    });

    expect(settlementsRepo.updateOutstandingBalanceStatus).toHaveBeenCalledWith(
      "settlement-2",
      "waived",
      expect.anything(),
      expect.objectContaining({
        resolvedBy: "admin-1",
        resolution: "waived",
      }),
    );
  });
});
