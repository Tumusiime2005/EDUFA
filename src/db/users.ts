import { db } from './index.ts';
import { users, profiles } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, role: string = 'applicant', fullName?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    let userRecord = existing[0];

    if (!userRecord) {
      const inserted = await db.insert(users)
        .values({
          uid,
          email,
          role,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
          },
        })
        .returning();
      userRecord = inserted[0];
    }

    // Ensure profile exists
    if (userRecord) {
      const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, userRecord.id));
      if (!existingProfile[0]) {
        await db.insert(profiles).values({
          userId: userRecord.id,
          fullName: fullName || email.split('@')[0],
          region: 'National',
        });
      }
    }

    return userRecord;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Database operation failed for user lookup/creation', { cause: error });
  }
}

export async function getUserWithProfile(userId: number) {
  try {
    const userRes = await db.select().from(users).where(eq(users.id, userId));
    if (!userRes[0]) return null;
    const profileRes = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return {
      ...userRes[0],
      profile: profileRes[0] || null,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile', { cause: error });
  }
}
