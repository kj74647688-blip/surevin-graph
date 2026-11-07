import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '../firebase';

// Memory cache for OAuth access token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://mail.google.com/',
];

export interface GoogleContact {
  resourceName: string;
  name: string;
  email: string;
  phone?: string;
}

/**
 * Initiates Google OAuth Popup with Gmail & Contacts scopes.
 */
export async function authenticateGoogleWorkspace(): Promise<{ user: User; accessToken: string }> {
  if (cachedAccessToken && auth.currentUser) {
    return { user: auth.currentUser, accessToken: cachedAccessToken };
  }

  const provider = new GoogleAuthProvider();
  WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Workspace Authentication error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function clearWorkspaceToken(): void {
  cachedAccessToken = null;
}

/**
 * Fetches user's Google Contacts via People API
 */
export async function fetchGoogleContacts(token: string): Promise<GoogleContact[]> {
  try {
    const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100';
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Contacts API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const connections = data.connections || [];

    return connections
      .map((person: any) => {
        const name = person.names?.[0]?.displayName || 'Unnamed Contact';
        const email = person.emailAddresses?.[0]?.value || '';
        const phone = person.phoneNumbers?.[0]?.value || '';

        return {
          resourceName: person.resourceName,
          name,
          email,
          phone,
        };
      })
      .filter((c: GoogleContact) => c.email.length > 0);
  } catch (err) {
    console.error('Failed to fetch Google Contacts:', err);
    throw err;
  }
}

/**
 * Helper to encode string/binary into Base64URL string (RFC 4648)
 */
function base64UrlEncode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using Gmail API users.messages.send
 * Requires explicit user confirmation prior to execution per Workspace skill directives.
 */
export async function sendGmailMessage(
  token: string,
  params: {
    to: string;
    subject: string;
    bodyText: string;
    attachmentName?: string;
    attachmentBase64?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const { to, subject, bodyText, attachmentName, attachmentBase64 } = params;

  let rawMessage = '';

  if (attachmentName && attachmentBase64) {
    const boundary = '===ScoreFutureBoundary' + Date.now() + '===';
    rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      bodyText,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${attachmentName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachmentName}"`,
      '',
      attachmentBase64,
      '',
      `--${boundary}--`,
    ].join('\r\n');
  } else {
    rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      bodyText,
    ].join('\r\n');
  }

  const encodedRaw = base64UrlEncode(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedRaw,
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(`Gmail API failed (${response.status}): ${errJson.error?.message || response.statusText}`);
  }

  return response.json();
}
