import { db } from './index.ts';
import { users, profiles } from './schema.ts';
import { eq, or } from 'drizzle-orm';

export const SYSTEM_ADMIN_EMAIL = 'tumusiimeeltonmarvin@gmail.com';
export const SYSTEM_ADMIN_PASSWORD = 'Admin@2026';

async function ensureSystemAdminUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== SYSTEM_ADMIN_EMAIL) {
    return null;
  }

  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (existing[0]) {
    const currentUser = existing[0];
    const needsSync = currentUser.role !== 'committee' || currentUser.password !== SYSTEM_ADMIN_PASSWORD;
    if (needsSync) {
      await db.update(users)
        .set({
          role: 'committee',
          password: SYSTEM_ADMIN_PASSWORD,
        })
        .where(eq(users.id, currentUser.id));
    }
    return { ...currentUser, role: 'committee', password: SYSTEM_ADMIN_PASSWORD };
  }

  const [created] = await db.insert(users).values({
    uid: 'admin-committee-uid',
    email: normalizedEmail,
    role: 'committee',
    password: SYSTEM_ADMIN_PASSWORD,
  }).onConflictDoUpdate({
    target: users.uid,
    set: {
      email: normalizedEmail,
      role: 'committee',
      password: SYSTEM_ADMIN_PASSWORD,
    },
  }).returning();

  return created;
}

export async function getOrCreateUser(uid: string, email: string, role: string = 'applicant', fullName?: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await ensureSystemAdminUser(normalizedEmail);

    const existing = await db.select().from(users).where(eq(users.uid, uid));
    let userRecord = existing[0];

    if (!userRecord) {
      const inserted = await db.insert(users)
        .values({
          uid,
          email: normalizedEmail,
          role,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: normalizedEmail,
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

export async function registerApplicantUser({
  email,
  password,
  fullName,
  phone,
  region,
  role = 'applicant',
}: {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  region?: string;
  role?: 'applicant' | 'committee' | 'admin';
}) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existing[0]) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const [newUser] = await db.insert(users).values({
      uid,
      email: normalizedEmail,
      password: password ? password.trim() : null,
      role,
    }).returning();

    const [newProfile] = await db.insert(profiles).values({
      userId: newUser.id,
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : null,
      region: region ? region.trim() : 'Central Region (Kampala)',
    }).returning();

    return {
      ...newUser,
      profile: newProfile,
    };
  } catch (error: any) {
    console.error('Error in registerApplicantUser:', error);
    throw new Error(error.message || 'Registration failed');
  }
}

export async function loginUser({
  email,
  password,
  expectedRole,
}: {
  email: string;
  password?: string;
  expectedRole?: 'applicant' | 'committee';
}) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userRows = await db.select().from(users).where(eq(users.email, normalizedEmail));
    let user = userRows[0];

    // Ensure the system admin login credential exists and is configured with the required password.
    if (normalizedEmail === SYSTEM_ADMIN_EMAIL) {
      const adminUser = await ensureSystemAdminUser(normalizedEmail);
      if (adminUser) {
        user = adminUser;
      }
    }

    if (!user) {
      throw new Error('No account found with this email. Please check your credentials or register a new applicant account.');
    }

    // Role verification
    if (expectedRole && user.role !== expectedRole && user.role !== 'admin') {
      if (expectedRole === 'committee') {
        throw new Error('This account does not have Committee / Admin evaluator clearance.');
      }
    }

    // If password provided and user has a password set, verify
    if (password && user.password && user.password !== password.trim()) {
      throw new Error('Invalid password provided. Please check your credentials.');
    }

    const profileRows = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    return {
      ...user,
      profile: profileRows[0] || null,
    };
  } catch (error: any) {
    console.error('Error in loginUser:', error);
    throw new Error(error.message || 'Login failed');
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
