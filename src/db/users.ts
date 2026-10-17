import { db } from './index.ts';
import { users, profiles } from './schema.ts';
import { eq, or } from 'drizzle-orm';

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

    // If default admin logging in for the first time
    if (!user && (normalizedEmail === 'admin@dragonsenterprises.com' || normalizedEmail === 'chair.committee@edufa.org')) {
      const uid = 'admin-committee-uid';
      user = await getOrCreateUser(uid, normalizedEmail, 'committee', 'Admin Evaluator');
    }

    if (!user) {
      throw new Error('No account found with this email. Please check your credentials or register a new applicant account.');
    }

    // Role verification
    if (expectedRole) {
      if (expectedRole === 'committee' && user.role !== 'committee' && user.role !== 'admin') {
        throw new Error('This account does not have Committee / Admin evaluator clearance.');
      }
      if (expectedRole === 'applicant' && (user.role === 'committee' || user.role === 'admin')) {
        throw new Error('This is an Administrative account. Please sign in through the Committee & Admin portal.');
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

export async function getAllAdmins() {
  try {
    const adminRows = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        fullName: profiles.fullName,
        phone: profiles.phone,
        region: profiles.region,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(or(eq(users.role, 'committee'), eq(users.role, 'admin')));

    return adminRows;
  } catch (error) {
    console.error('Error fetching all admins:', error);
    throw new Error('Failed to fetch admin accounts', { cause: error });
  }
}

