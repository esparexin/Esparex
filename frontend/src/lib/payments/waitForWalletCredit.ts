import { getWalletSummary, type WalletSummary } from "@/lib/api/user/users";

type WalletCreditField = keyof Pick<WalletSummary, "adCredits" | "spotlightCredits" | "smartAlertSlots">;

export async function waitForWalletCredit(
  field: WalletCreditField,
  baseline: number,
  minimumDelta: number = 1,
  timeoutMs: number = 45000,
  intervalMs: number = 3000
): Promise<WalletSummary | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const wallet = await getWalletSummary();
    if (wallet && wallet[field] >= baseline + minimumDelta) {
      return wallet;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}
