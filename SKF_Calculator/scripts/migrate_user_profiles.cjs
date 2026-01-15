const admin = require('firebase-admin');
const path = require('path');

async function main() {
  const svcPath = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (svcPath) {
    const resolved = path.resolve(svcPath);
    console.log('Initializing firebase-admin with service account:', resolved);
    const serviceAccount = require(resolved);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.log('No service account path provided; attempting applicationDefault() credentials.');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const db = admin.firestore();
  const collectionName = 'userProfiles';

  console.log('Reading all documents from collection:', collectionName);
  const snapshot = await db.collection(collectionName).get();
  console.log(`Found ${snapshot.size} documents.`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const docId = docSnap.id;
    const data = docSnap.data();
    const userId = data && data.userId;
    if (!userId) {
      console.warn(`Skipping doc ${docId} - no userId field.`);
      skipped++;
      continue;
    }

    if (docId === userId) {
      console.log(`Doc ${docId} already uses userId as id - skipping.`);
      skipped++;
      continue;
    }

    const targetRef = db.collection(collectionName).doc(userId);
    try {
      const targetSnap = await targetRef.get();
      if (targetSnap.exists) {
        console.warn(`Target doc for userId ${userId} already exists (id=${targetSnap.id}). Skipping migration of ${docId}.`);
        skipped++;
        continue;
      }

      // Write data to target doc (preserve fields)
      await targetRef.set(data);
      // Delete old doc
      await docSnap.ref.delete();
      console.log(`Migrated ${docId} -> ${userId}`);
      migrated++;
    } catch (err) {
      console.error(`Failed to migrate ${docId} -> ${userId}:`, err);
      failed++;
    }
  }

  console.log('Migration complete. Summary:');
  console.log('  total:', snapshot.size);
  console.log('  migrated:', migrated);
  console.log('  skipped:', skipped);
  console.log('  failed:', failed);

  process.exit(0);
}

main().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});

