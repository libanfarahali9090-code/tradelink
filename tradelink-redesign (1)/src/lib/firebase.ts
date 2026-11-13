import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';

// Config comes from VITE_FIREBASE_* environment variables so it need not be committed.
// If a local firebase-applet-config.json exists (for example in Google AI Studio, which creates
// it), it is used as a fallback. The file is gitignored; do not commit it.
// A Firebase web key still ships inside the built site, so restrict it by website in Google
// Cloud and rely on the Firestore rules for protection.
const env = import.meta.env;
const fileConfigs = import.meta.glob('../../firebase-applet-config.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>;
const fileConfig = Object.values(fileConfigs)[0] ?? {};

const firebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined) || fileConfig.apiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || fileConfig.authDomain,
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined) || fileConfig.projectId,
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined) || fileConfig.appId,
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || fileConfig.storageBucket,
  messagingSenderId:
    (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) || fileConfig.messagingSenderId,
};
const firestoreDatabaseId =
  (env.VITE_FIREBASE_DATABASE_ID as string | undefined) || fileConfig.firestoreDatabaseId;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase is not configured. Set the VITE_FIREBASE_* variables (see .env.example).'
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAIL = 'kaafiebirr95@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
