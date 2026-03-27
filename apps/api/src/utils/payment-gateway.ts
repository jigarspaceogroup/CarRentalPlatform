/**
 * Mock payment gateway for development.
 *
 * In production, replace these stubs with real Stripe / PayPal SDK calls.
 * Every function returns a deterministic-looking response so that the full
 * payment flow can be exercised end-to-end during development.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChargeResult {
  transactionId: string;
  status: 'success' | 'failed';
}

export interface RefundResult {
  refundId: string;
  status: 'success' | 'failed';
}

export interface TokenizeResult {
  gatewayToken: string;
}

// ---------------------------------------------------------------------------
// Mock implementations
// ---------------------------------------------------------------------------

/**
 * Charge a credit / debit card via the payment gateway.
 */
export async function chargeCard(
  _amount: number,
  _currency: string,
  _cardToken: string,
): Promise<ChargeResult> {
  // Simulate a short async delay
  await new Promise((r) => setTimeout(r, 50));

  return {
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'success',
  };
}

/**
 * Refund a previously completed payment.
 */
export async function refundPayment(
  _transactionId: string,
  _amount: number,
): Promise<RefundResult> {
  await new Promise((r) => setTimeout(r, 50));

  return {
    refundId: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'success',
  };
}

/**
 * Tokenize a card for future use (save card).
 */
export async function tokenizeCard(_cardToken: string): Promise<TokenizeResult> {
  await new Promise((r) => setTimeout(r, 50));

  return {
    gatewayToken: `tok_${Math.random().toString(36).slice(2, 14)}`,
  };
}
