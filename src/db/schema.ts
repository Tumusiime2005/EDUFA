import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').notNull().default('applicant'), // 'applicant' | 'committee' | 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  region: text('region'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  applicantId: integer('applicant_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  financialDataJson: text('financial_data_json').notNull(),
  academicDataJson: text('academic_data_json').notNull(),
  alignmentDataJson: text('alignment_data_json').notNull(),
  fundingScopeJson: text('funding_scope_json').notNull(),
  status: text('status').notNull().default('submitted'), // 'draft' | 'submitted' | 'under_review' | 'more_info_requested' | 'approved' | 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scoreRecords = pgTable('score_records', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id')
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(),
  needScore: doublePrecision('need_score').notNull(),
  academicScore: doublePrecision('academic_score').notNull(),
  alignmentScore: doublePrecision('alignment_score').notNull(),
  sustainabilityScore: doublePrecision('sustainability_score').notNull(),
  compositeScore: doublePrecision('composite_score').notNull(),
  explanationJson: text('explanation_json').notNull(),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
});

export const decisions = pgTable('decisions', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id')
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(),
  reviewerId: integer('reviewer_id')
    .references(() => users.id)
    .notNull(),
  action: text('action').notNull(), // 'approve' | 'reject' | 'request_info'
  notes: text('notes').notNull(),
  decidedAt: timestamp('decided_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  recipientId: integer('recipient_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  applications: many(applications),
  decisions: many(decisions),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  applicant: one(users, {
    fields: [applications.applicantId],
    references: [users.id],
  }),
  scoreRecords: many(scoreRecords),
  decisions: many(decisions),
}));

export const scoreRecordsRelations = relations(scoreRecords, ({ one }) => ({
  application: one(applications, {
    fields: [scoreRecords.applicationId],
    references: [applications.id],
  }),
}));

export const decisionsRelations = relations(decisions, ({ one }) => ({
  application: one(applications, {
    fields: [decisions.applicationId],
    references: [applications.id],
  }),
  reviewer: one(users, {
    fields: [decisions.reviewerId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));
