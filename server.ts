import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { users, profiles, notifications, applications } from './src/db/schema.ts';
import { eq, or } from 'drizzle-orm';
import {
  createApplicationRecord,
  getAllApplicationsWithDetails,
  getApplicationDetails,
  submitCommitteeDecision,
  getUserNotifications,
  markNotificationAsRead,
} from './src/db/applications.ts';
import { getOrCreateUser, getUserWithProfile, registerApplicantUser, loginUser, getAllAdmins } from './src/db/users.ts';
import { calculateFairnessScore, validateNextOfKinNIN } from './src/lib/scoring-engine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'EDUFA Fairness Scorer Backend', timestamp: new Date().toISOString() });
});

// User Sync / Profile Lookup
app.post('/api/auth/sync', async (req: Request, res: Response) => {
  try {
    const { uid, email, role, fullName } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing required uid or email' });
    }
    const user = await getOrCreateUser(uid, email, role || 'applicant', fullName);
    const profile = await getUserWithProfile(user.id);
    res.json({ success: true, user: profile });
  } catch (error: any) {
    console.error('Error syncing auth user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Applicant Registration
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, region, role } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and full name are required.' });
    }
    const user = await registerApplicantUser({
      email,
      password,
      fullName,
      phone,
      region,
      role: role || 'applicant',
    });
    res.status(201).json({ success: true, user });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// User / Admin Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, expectedRole } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const user = await loginUser({ email, password, expectedRole });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

// Verify Current User Session
app.get('/api/auth/verify', async (req: Request, res: Response) => {
  try {
    const userId = req.query.id ? parseInt(req.query.id as string, 10) : null;
    if (!userId) return res.status(400).json({ error: 'Missing user id' });
    const user = await getUserWithProfile(userId);
    if (!user) return res.status(404).json({ error: 'User not found in system registry' });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// List all Committee Administrators (Admins Page only)
app.get('/api/admin/admins', async (_req: Request, res: Response) => {
  try {
    const adminList = await getAllAdmins();
    res.json(adminList);
  } catch (error: any) {
    console.error('Error retrieving admins:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch admins list' });
  }
});

// Assign a New Administrator (Available only within the Admins Page)
app.post('/api/admin/assign', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, region } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Official email and full legal name are required.' });
    }
    const user = await registerApplicantUser({
      email,
      password,
      fullName,
      phone,
      region: region || 'Central Region (Kampala)',
      role: 'committee',
    });
    res.status(201).json({ success: true, user, message: 'New Committee Administrator assigned successfully.' });
  } catch (error: any) {
    console.error('Error assigning admin:', error);
    res.status(400).json({ error: error.message || 'Failed to assign administrator' });
  }
});

// Calculate Preview (Instant multi-pillar explainable score calculation)
app.post('/api/calculate-preview', (req: Request, res: Response) => {
  try {
    const { financial, academic, alignment, funding } = req.body;
    if (!financial || !academic || !alignment || !funding) {
      return res.status(400).json({ error: 'Missing one or more pillar assessment models' });
    }
    const calculated = calculateFairnessScore(financial, academic, alignment, funding);
    res.json(calculated);
  } catch (error: any) {
    console.error('Error calculating score preview:', error);
    res.status(500).json({ error: error.message || 'Calculation engine failed' });
  }
});

// List all applications (Committee & Applicant filtered)
app.get('/api/applications', async (req: Request, res: Response) => {
  try {
    const userIdQuery = req.query.applicantId as string | undefined;
    const all = await getAllApplicationsWithDetails();
    if (userIdQuery) {
      const filtered = all.filter((a) => a.applicantId === parseInt(userIdQuery, 10));
      return res.json(filtered);
    }
    res.json(all);
  } catch (error: any) {
    console.error('Error retrieving applications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch applications' });
  }
});

// Get single application
app.get('/api/applications/:id', async (req: Request, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) return res.status(400).json({ error: 'Invalid application ID' });
    const appData = await getApplicationDetails(appId);
    if (!appData) return res.status(404).json({ error: 'Application not found' });
    res.json(appData);
  } catch (error: any) {
    console.error('Error retrieving application detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch application' });
  }
});

// Create Application
app.post('/api/applications', async (req: Request, res: Response) => {
  try {
    let {
      applicantId,
      applicantEmail,
      applicantName,
      applicantRegion,
      financialData,
      academicData,
      alignmentData,
      fundingScopeData,
    } = req.body;

    if (!financialData || !academicData || !alignmentData || !fundingScopeData) {
      return res.status(400).json({ error: 'All 4 evaluation pillars are required.' });
    }

    // Background verification for Next of Kin NIN (no public hint exposed)
    if (financialData?.personalData?.nextOfKin) {
      const { gender, nin } = financialData.personalData.nextOfKin;
      if (gender && nin) {
        const validation = validateNextOfKinNIN(gender, nin);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
      }
    }

    // Verification for prior level completed and previous school student ID for conformity
    const levelProof = academicData?.levelCompletionProof;
    if (!levelProof || !levelProof.previousSchoolStudentId || !levelProof.previousSchoolStudentId.trim()) {
      return res.status(400).json({ error: 'Student ID of the previous school is required for institutional conformity verification.' });
    }
    if (!levelProof.previousSchoolName || !levelProof.previousSchoolName.trim()) {
      return res.status(400).json({ error: 'Name of the previous school is required for conformity verification.' });
    }
    if (!levelProof.isScanned) {
      return res.status(400).json({ error: 'Level completion proof document must be scanned first via the Digital Optical Scanner.' });
    }

    // Resolve or create applicant user so foreign key constraint never fails
    let targetId: number | null = applicantId ? parseInt(applicantId, 10) : null;
    if (targetId) {
      const existing = await db.select().from(users).where(eq(users.id, targetId));
      if (!existing[0]) {
        targetId = null;
      }
    }

    if (!targetId) {
      const email = applicantEmail || `applicant_${Date.now()}@dragonsenterprises.com`;
      const name = applicantName || 'Applicant Scholar';
      const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const user = await getOrCreateUser(uid, email, 'applicant', name);
      targetId = user.id;

      if (applicantRegion) {
        await db.update(profiles)
          .set({ region: applicantRegion })
          .where(eq(profiles.userId, user.id));
      }
    }

    // Strict Limit: One dossier per applicant account. No duplicate submissions permitted.
    if (targetId) {
      const existingDossier = await db
        .select()
        .from(applications)
        .where(eq(applications.applicantId, targetId));

      if (existingDossier.length > 0) {
        return res.status(400).json({
          error: `This applicant account has already submitted an official bursary dossier (#${existingDossier[0].id}). Each applicant account is strictly limited to one application dossier.`,
        });
      }
    }

    const result = await createApplicationRecord({
      applicantId: targetId,
      financialData,
      academicData,
      alignmentData,
      fundingScopeData,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: error.message || 'Application submission failed' });
  }
});

// Committee Decision Action (Approve, Reject, Request Info)
app.post('/api/applications/:id/decision', async (req: Request, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const { reviewerId, action, notes } = req.body;

    if (!reviewerId || !action || !notes || !notes.trim()) {
      return res.status(400).json({ error: 'Reviewer ID, action (approve/reject/request_info), and mandatory reviewer notes are required.' });
    }

    if (!['approve', 'reject', 'request_info'].includes(action)) {
      return res.status(400).json({ error: 'Invalid decision action. Must be approve, reject, or request_info.' });
    }

    const decision = await submitCommitteeDecision({
      applicationId: appId,
      reviewerId: parseInt(reviewerId, 10),
      action,
      notes,
    });

    res.json({ success: true, decision });
  } catch (error: any) {
    console.error('Error recording committee decision:', error);
    res.status(500).json({ error: error.message || 'Failed to record committee decision' });
  }
});

// Applicant Clarification / Feedback Response
app.post('/api/applications/:id/clarification', async (req: Request, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const { message, senderId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Clarification message is required.' });
    }

    // Notify committee members of received clarification
    const committeeUsers = await db.select().from(users).where(
      or(eq(users.role, 'committee'), eq(users.role, 'admin'))
    );
    for (const cUser of committeeUsers) {
      await db.insert(notifications).values({
        recipientId: cUser.id,
        title: `Clarification Info Received (#${appId})`,
        message: `Applicant provided additional documents/notes: "${message.trim()}"`,
      });
    }

    // Direct feedback receipt to applicant
    if (senderId) {
      await db.insert(notifications).values({
        recipientId: parseInt(senderId, 10),
        title: 'Information Transmitted to Committee',
        message: `Your clarification details for application #${appId} have been delivered to the Bursary Committee. Status updated: Under verification.`,
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending clarification:', error);
    res.status(500).json({ error: error.message || 'Failed to send clarification' });
  }
});

// Notifications
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });
    const notifs = await getUserNotifications(userId);
    res.json(notifs);
  } catch (error: any) {
    console.error('Error retrieving notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const updated = await markNotificationAsRead(notifId);
    res.json({ success: true, notification: updated });
  } catch (error: any) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

// Explicit 404 handler for API routes (prevent Vite SPA from catching API requests and serving HTML)
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Explicit error handler for API routes
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('API Error:', err);
  if (req.path.startsWith('/api') || !res.headersSent) {
    return res.status(err.status || 500).json({ error: err.message || 'Internal API Server Error' });
  }
  next(err);
});

// Vite middleware (dev) / static file serving (prod)
async function startServer() {

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EDUFA Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start EDUFA server:', err);
});
