// Mock FCM push notification sender
// In production, this would use Firebase Admin SDK

export async function sendPushNotification(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<boolean> {
  // Mock implementation - log and return success
  console.log(`[FCM Mock] Push to user ${params.userId}: ${params.title}`);
  return true;
}
