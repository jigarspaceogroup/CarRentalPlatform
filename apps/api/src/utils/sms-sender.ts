// Mock SMS sender via Twilio
// In production, this would use Twilio SDK

export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<boolean> {
  console.log(`[SMS Mock] To ${params.to}: ${params.body}`);
  return true;
}
