import { ClientSecretCredential } from '@azure/identity';
import { Client as GraphClient } from '@microsoft/microsoft-graph-client';

const SCOPES = ['https://graph.microsoft.com/.default'];  // Application permissions ke liye

export async function getOutlookGraphClient() {
  try {
    const credential = new ClientSecretCredential(
      process.env.OUTLOOK_TENANT_ID!,
      process.env.OUTLOOK_CLIENT_ID!,
      process.env.OUTLOOK_CLIENT_SECRET!
    );

    const authProvider = {
      getAccessToken: async () => {
        const result = await credential.getToken(SCOPES[0]);
        if (!result?.token) {
          throw new Error('Failed to get access token');
        }
        return result.token;
      },
    };

    const client = GraphClient.initWithMiddleware({ authProvider });
    return client;
  } catch (error) {
    console.error('Outlook auth error:', error);
    throw new Error('Outlook authentication failed');
  }
}
