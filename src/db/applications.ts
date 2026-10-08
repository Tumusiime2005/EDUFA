import { db } from './index.ts';
import { applications, scoreRecords, decisions, notifications, users, profiles } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { calculateFairnessScore, FinancialData, AcademicData, AlignmentData, FundingScopeData } from '../lib/scoring-engine.ts';

export async function createApplicationRecord({
  applicantId,
  financialData,
  academicData,
  alignmentData,
  fundingScopeData,
}: {
  applicantId: number;
  financialData: FinancialData;
  academicData: AcademicData;
  alignmentData: AlignmentData;
  fundingScopeData: FundingScopeData;
}) {
  try {
    const calculated = calculateFairnessScore(financialData, academicData, alignmentData, fundingScopeData);

    const [app] = await db.insert(applications).values({
      applicantId,
      financialDataJson: JSON.stringify(financialData),
      academicDataJson: JSON.stringify(academicData),
      alignmentDataJson: JSON.stringify(alignmentData),
      fundingScopeJson: JSON.stringify(fundingScopeData),
      status: 'submitted',
    }).returning();

    const [score] = await db.insert(scoreRecords).values({
      applicationId: app.id,
      needScore: calculated.needScore,
      academicScore: calculated.academicScore,
      alignmentScore: calculated.alignmentScore,
      sustainabilityScore: calculated.sustainabilityScore,
      compositeScore: calculated.compositeScore,
      explanationJson: JSON.stringify(calculated.explanation),
    }).returning();

    // Notifications (non-blocking)
    try {
      await db.insert(notifications).values({
        recipientId: applicantId,
        title: 'Application Submitted',
        message: `Your bursary application #${app.id} was successfully submitted with a preliminary Fairness Score of ${calculated.compositeScore.toFixed(1)}/100. Our committee is actively reviewing your dossier.`,
      });

      let committeeUsers = await db.select().from(users).where(eq(users.role, 'committee'));
      if (committeeUsers.length === 0) {
        const adminEmail = 'admin@dragonsenterprises.com';
        const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
        if (existingAdmin[0]) {
          committeeUsers = [existingAdmin[0]];
        } else {
          const [newAdmin] = await db.insert(users).values({
            uid: 'admin-committee-uid',
            email: adminEmail,
            role: 'committee',
          }).returning();
          committeeUsers = [newAdmin];
        }
      }

      for (const cUser of committeeUsers) {
        await db.insert(notifications).values({
          recipientId: cUser.id,
          title: 'New Bursary Application Submitted',
          message: `Application #${app.id} logged. Preliminary Composite Fairness Score: ${calculated.compositeScore.toFixed(1)}/100 (${calculated.explanation.equityTier}).`,
        });
      }
    } catch (notifErr) {
      console.warn('Notification insert notice:', notifErr);
    }

    return { application: app, scoreRecord: score };
  } catch (error) {
    console.error('Failed to create application:', error);
    throw new Error('Failed to create bursary application', { cause: error });
  }
}

export async function getAllApplicationsWithDetails() {
  try {
    const allApps = await db.select().from(applications).orderBy(desc(applications.createdAt));
    const result = [];

    for (const app of allApps) {
      const applicant = await db.select().from(users).where(eq(users.id, app.applicantId));
      const profile = applicant[0] ? await db.select().from(profiles).where(eq(profiles.userId, applicant[0].id)) : [];
      const scores = await db.select().from(scoreRecords).where(eq(scoreRecords.applicationId, app.id)).orderBy(desc(scoreRecords.calculatedAt));
      const appDecisions = await db.select().from(decisions).where(eq(decisions.applicationId, app.id)).orderBy(desc(decisions.decidedAt));

      result.push({
        ...app,
        financialData: JSON.parse(app.financialDataJson || '{}'),
        academicData: JSON.parse(app.academicDataJson || '{}'),
        alignmentData: JSON.parse(app.alignmentDataJson || '{}'),
        fundingScopeData: JSON.parse(app.fundingScopeJson || '{}'),
        applicant: applicant[0] ? {
          id: applicant[0].id,
          email: applicant[0].email,
          role: applicant[0].role,
          profile: profile[0] || null,
        } : null,
        scoreRecord: scores[0] ? {
          ...scores[0],
          explanation: JSON.parse(scores[0].explanationJson || '{}'),
        } : null,
        decisions: appDecisions,
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    throw new Error('Failed to retrieve applications', { cause: error });
  }
}

export async function getApplicationDetails(applicationId: number) {
  try {
    const apps = await db.select().from(applications).where(eq(applications.id, applicationId));
    if (!apps[0]) return null;
    const app = apps[0];

    const applicant = await db.select().from(users).where(eq(users.id, app.applicantId));
    const profile = applicant[0] ? await db.select().from(profiles).where(eq(profiles.userId, applicant[0].id)) : [];
    const scores = await db.select().from(scoreRecords).where(eq(scoreRecords.applicationId, app.id)).orderBy(desc(scoreRecords.calculatedAt));
    const appDecisions = await db.select().from(decisions).where(eq(decisions.applicationId, app.id)).orderBy(desc(decisions.decidedAt));

    return {
      ...app,
      financialData: JSON.parse(app.financialDataJson || '{}'),
      academicData: JSON.parse(app.academicDataJson || '{}'),
      alignmentData: JSON.parse(app.alignmentDataJson || '{}'),
      fundingScopeData: JSON.parse(app.fundingScopeJson || '{}'),
      applicant: applicant[0] ? {
        id: applicant[0].id,
        email: applicant[0].email,
        role: applicant[0].role,
        profile: profile[0] || null,
      } : null,
      scoreRecord: scores[0] ? {
        ...scores[0],
        explanation: JSON.parse(scores[0].explanationJson || '{}'),
      } : null,
      decisions: appDecisions,
    };
  } catch (error) {
    console.error('Failed to fetch application details:', error);
    throw new Error('Failed to retrieve application detail', { cause: error });
  }
}

export async function submitCommitteeDecision({
  applicationId,
  reviewerId,
  action,
  notes,
}: {
  applicationId: number;
  reviewerId: number;
  action: 'approve' | 'reject' | 'request_info';
  notes: string;
}) {
  try {
    const [decision] = await db.insert(decisions).values({
      applicationId,
      reviewerId,
      action,
      notes,
    }).returning();

    let newStatus = 'under_review';
    let notifTitle = 'Update on Your Application';
    let notifMsg = '';

    if (action === 'approve') {
      newStatus = 'approved';
      notifTitle = '🎉 Bursary Award Approved!';
      notifMsg = `Congratulations! The Committee has approved your bursary allocation. Notes: "${notes}"`;
    } else if (action === 'reject') {
      newStatus = 'rejected';
      notifTitle = 'Bursary Allocation Status Decision';
      notifMsg = `The Committee has concluded review of application #${applicationId}. Status: Not selected in this funding round. Notes: "${notes}"`;
    } else if (action === 'request_info') {
      newStatus = 'more_info_requested';
      notifTitle = 'Further Documents / Clarification Requested';
      notifMsg = `The Committee requests additional documentation: "${notes}". Please update your application portal.`;
    }

    await db.update(applications)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(applications.id, applicationId));

    // Get applicant to send notification
    const app = await db.select().from(applications).where(eq(applications.id, applicationId));
    if (app[0]) {
      await db.insert(notifications).values({
        recipientId: app[0].applicantId,
        title: notifTitle,
        message: notifMsg,
      });
    }

    return decision;
  } catch (error) {
    console.error('Failed to record decision:', error);
    throw new Error('Failed to submit committee decision', { cause: error });
  }
}

export async function getUserNotifications(userId: number) {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId));
    const isCommittee = user[0] && (user[0].role === 'committee' || user[0].role === 'admin');

    if (isCommittee) {
      const committeeUsers = await db.select().from(users).where(eq(users.role, 'committee'));
      const committeeIds = new Set(committeeUsers.map((u) => u.id));
      committeeIds.add(userId);

      const allNotifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
      return allNotifs.filter(
        (n) =>
          committeeIds.has(n.recipientId) ||
          n.title.toLowerCase().includes('application submitted') ||
          n.title.toLowerCase().includes('candidate') ||
          n.title.toLowerCase().includes('dossier')
      );
    }

    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error('Failed to get notifications:', error);
    throw new Error('Failed to get notifications', { cause: error });
  }
}

export async function markNotificationAsRead(notificationId: number) {
  try {
    const [updated] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updated;
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    throw new Error('Failed to update notification', { cause: error });
  }
}

// Real Data Only: No mock data or seed generation. All applications are received from applicants and updated by admin feedback.
