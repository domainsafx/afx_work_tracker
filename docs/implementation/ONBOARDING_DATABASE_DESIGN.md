# AVANFlix Work Tracker — Complete PostgreSQL & Prisma Schema Design

**Module:** Complete System Schema (Migrated Core Tracker + Onboarding Module)  
**Target Database:** PostgreSQL 16+ via Prisma ORM  
**Version:** 2.0.0 (Phase 0 Final Specification)  
**Status:** Approved Master Schema  

---

## 1. Schema Architecture Overview

This document provides the complete, production-grade Prisma schema definition for the entire AVANFlix Work Tracker application. It encompasses:
1. **The Migrated Core Application (21 Models Normalized into 28 Tables):** User authentication, task management, checklists, timelines, work logs, leave requests, client deliverables, shoot equipment, calls, meetings, notifications, and locks.
2. **The Employee Recruitment & Onboarding Module (7 Tables):** Candidates, KYC identities, banking details, legal documents, audit logs, the centralized `EmployeeIdRegistry`, and the transactional `EmailOutbox`.

---

## 2. Complete Master Prisma Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// 1. CORE ENUMS
// ==========================================

enum Role {
  SUPER_ADMIN
  ADMIN
  EMPLOYEE
}

enum AvailabilityStatus {
  ACTIVE
  ON_LEAVE
  INACTIVE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

enum TaskStatus {
  PENDING
  NOTICED
  IN_PROGRESS
  COMPLETED
  ISSUE
  DELAYED
  CANCELLED
}

enum TaskStage {
  CHECKLIST
  WIP
  WAITING_FOR_APPROVAL
  CHANGES_TO_BE_MADE
  SENT_TO_CLIENT
  FINALIZED
  CLOSED
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

enum LeaveType {
  CASUAL
  SICK
  UNPAID
  EMERGENCY
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  WITHDRAWN
}

enum EquipmentCategory {
  CAMERA
  LENS
  AUDIO
  LIGHTING
  GRIP
  DRONE
  STORAGE
  OTHER
}

enum ShootLogStatus {
  OUT
  RETURNED
}

enum ReturnCondition {
  OK
  DAMAGED
  MISSING
}

enum ConversationType {
  DIRECT
  GROUP
}

enum CallType {
  DIRECT
  MEETING
}

enum CallMediaType {
  AUDIO
  VIDEO
}

enum CallStatus {
  RINGING
  ACTIVE
  ENDED
  MISSED
  DECLINED
}

enum MeetingStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum NotificationType {
  TASK_ASSIGNED
  DEADLINE_APPROACHING
  TASK_COMPLETED
  TASK_ISSUE
  DELAY_SUBMITTED
  DELAY_REVIEWED
  MEETING_SCHEDULED
  MEETING_CANCELLED
  TASK_UPDATE_REQUESTED
  TASK_UPDATE_REVIEWED
  LEAVE_REQUESTED
  LEAVE_REVIEWED
  LEAVE_WITHDRAWN
  HOLIDAY_ADDED
  GENERAL
}

// Onboarding specific enums
enum EmploymentType {
  EMPLOYEE
  INTERN_PAID
  INTERN_UNPAID
}

enum CandidateStatus {
  INVITED
  APPLICATION_SUBMITTED
  UNDER_REVIEW
  CORRECTION_REQUESTED
  APPLICATION_APPROVED
  OFFER_SENT
  OFFER_ACCEPTED
  OFFER_DECLINED
  DOCUMENTS_PENDING
  DOCUMENTS_SUBMITTED
  DOCUMENTS_VERIFIED
  FINAL_APPROVAL_PENDING
  COMPLETED
  REJECTED
}

enum OnboardingDocType {
  OFFER_LETTER
  JOINING_LETTER
  NOC_UNDERTAKING
  NDA_AGREEMENT
  WELCOME_LETTER
}

enum DocumentStatus {
  GENERATED
  SENT
  SIGNED
  VERIFIED
  REJECTED
}

enum OutboxStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
}

enum EmployeeIdStatus {
  ALLOCATED
  ACTIVE
  RETIRED
}

// ==========================================
// 2. USER & AUTHENTICATION SUBSYSTEM
// ==========================================

model User {
  id                 String             @id @default(uuid())
  mongoId            String?            @unique
  name               String             @db.VarChar(150)
  firstName          String?            @db.VarChar(100)
  lastName           String?            @db.VarChar(100)
  employeeId         String?            @unique @db.VarChar(20)
  email              String             @unique @db.VarChar(255)
  passwordHash       String             @db.VarChar(255)
  role               Role               @default(EMPLOYEE)
  department         String?            @db.VarChar(100)
  designation        String?            @db.VarChar(100)
  joiningDate        DateTime?          @db.Date
  isActive           Boolean            @default(true)
  availabilityStatus AvailabilityStatus @default(ACTIVE)
  availability       String             @default("AVAILABLE") @db.VarChar(50)
  leaveFrom          DateTime?          @db.Date
  leaveTo            DateTime?          @db.Date
  leaveReason        String?            @db.Text
  phone              String?            @db.VarChar(20)
  whatsappOptIn      Boolean            @default(true)
  createdAt          DateTime           @default(now()) @db.Timestamptz
  updatedAt          DateTime           @updatedAt @db.Timestamptz

  // Relational associations
  assignedTasks          Task[]                   @relation("TaskAssignee")
  createdTasks           Task[]                   @relation("TaskCreator")
  timelineActions        TaskTimeline[]           @relation("TimelineAuthor")
  taskUpdates            TaskUpdate[]             @relation("UpdateAuthor")
  reviewedDelays         TaskDelaySubmission[]    @relation("DelayReviewer")
  submittedUpdates       TaskPendingUpdate[]      @relation("PendingUpdateSubmitter")
  reviewedUpdates        TaskPendingUpdate[]      @relation("PendingUpdateReviewer")
  transfersRequested     TransferRequest[]        @relation("TransferRequester")
  transfersTargeted      TransferRequest[]        @relation("TransferTarget")
  transfersReviewed      TransferRequest[]        @relation("TransferReviewer")
  workLogs               WorkLog[]
  leaveRequests          LeaveRequest[]           @relation("LeaveRequester")
  reviewedLeaves         LeaveRequest[]           @relation("LeaveReviewer")
  createdEquipment       Equipment[]              @relation("EquipmentCreator")
  shootLogsTaken         ShootLog[]               @relation("ShootLogTaker")
  createdClients         Client[]                 @relation("ClientCreator")
  createdDeliveries      DeliveryEvent[]          @relation("DeliveryCreator")
  conversationMemberships ConversationParticipant[]
  sentMessages           Message[]                @relation("MessageSender")
  readReceipts           MessageReadReceipt[]
  initiatedCalls         Call[]                   @relation("CallInitiator")
  callParticipations     CallParticipant[]
  sentSignals            CallSignal[]             @relation("SignalSender")
  receivedSignals        CallSignal[]             @relation("SignalReceiver")
  hostedMeetings         Meeting[]                @relation("MeetingHost")
  meetingMemberships     MeetingParticipant[]
  notifications          Notification[]           @relation("NotificationRecipient")
  appSettingsApprover    AppSettings[]            @relation("LeaveApproverUser")

  // Onboarding associations
  assignedCandidates     Candidate[]              @relation("CandidateOnboardingAssignee")
  createdCandidateUser   Candidate?               @relation("CandidateCreatedUser")
  verifiedIdentities     CandidateIdentity[]      @relation("IdentityVerifier")
  verifiedBankDetails    CandidateBankDetails[]   @relation("BankVerifier")
  verifiedDocuments      OnboardingDocument[]     @relation("DocumentVerifier")
  auditActions           OnboardingAuditLog[]     @relation("AuditActor")

  @@index([email])
  @@index([employeeId])
  @@index([role])
  @@index([department])
}

model PasswordResetOTP {
  id        String   @id @default(uuid())
  email     String   @db.VarChar(255)
  otpHash   String   @db.VarChar(255)
  expiresAt DateTime @db.Timestamptz
  createdAt DateTime @default(now()) @db.Timestamptz

  @@index([email])
  @@index([expiresAt])
}

model Department {
  id        String   @id @default(uuid())
  mongoId   String?  @unique
  name      String   @unique @db.VarChar(100)
  code      String   @unique @db.VarChar(20)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz
}

model Holiday {
  id          String   @id @default(uuid())
  mongoId     String?  @unique
  name        String   @db.VarChar(100)
  date        DateTime @db.Date
  year        Int
  description String?  @db.Text
  createdAt   DateTime @default(now()) @db.Timestamptz

  @@index([date])
  @@index([year])
}

model AppSettings {
  id              String   @id @default(uuid())
  leaveApproverId String?  @db.Uuid
  leaveApprover   User?    @relation("LeaveApproverUser", fields: [leaveApproverId], references: [id], onDelete: SetNull)
  updatedAt       DateTime @updatedAt @db.Timestamptz
}

model SystemLock {
  id          String   @id @default(uuid())
  key         String   @unique @db.VarChar(100)
  lockedBy    String   @db.VarChar(255)
  lockedAt    DateTime @db.Timestamptz
  lockedUntil DateTime @db.Timestamptz

  @@index([lockedUntil])
}

// ==========================================
// 3. TASK & PROJECT MANAGEMENT
// ==========================================

model Task {
  id                      String       @id @default(uuid())
  mongoId                 String?      @unique
  title                   String       @db.VarChar(255)
  description             String       @db.Text
  priority                TaskPriority @default(MEDIUM)
  department              String       @db.VarChar(100)
  assignedToId            String
  assignedTo              User         @relation("TaskAssignee", fields: [assignedToId], references: [id], onDelete: Restrict)
  createdById             String
  createdBy               User         @relation("TaskCreator", fields: [createdById], references: [id], onDelete: Restrict)
  startDate               DateTime     @db.Date
  deadline                DateTime     @db.Date
  estimatedHours          Float?
  status                  TaskStatus   @default(PENDING)
  stage                   TaskStage    @default(CHECKLIST)
  completionPercent       Int          @default(0)
  remarks                 String?      @db.Text
  currentIssue            String?      @db.Text
  stageLink               String?      @db.VarChar(2000)
  stageLinks              String[]     @default([])
  stageNote               String?      @db.Text
  timeSpentMinutes        Int          @default(0)
  estimatedCompletionDate DateTime?    @db.Date
  lastUpdatedById         String?
  lastUpdatedAt           DateTime?    @db.Timestamptz
  createdAt               DateTime     @default(now()) @db.Timestamptz
  updatedAt               DateTime     @updatedAt @db.Timestamptz

  timeline         TaskTimeline[]
  updates          TaskUpdate[]
  delaySubmissions TaskDelaySubmission[]
  pendingUpdates   TaskPendingUpdate[]
  transferRequests TransferRequest[]
  notifications    Notification[]
  onboardingFor    Candidate?           @relation("CandidateOnboardingTask")

  @@index([assignedToId])
  @@index([status])
  @@index([stage])
  @@index([deadline])
}

model TaskTimeline {
  id         String   @id @default(uuid())
  taskId     String
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  authorId   String?
  author     User?    @relation("TimelineAuthor", fields: [authorId], references: [id], onDelete: SetNull)
  authorName String   @db.VarChar(150)
  action     String   @db.VarChar(255)
  note       String?  @db.Text
  timestamp  DateTime @default(now()) @db.Timestamptz

  @@index([taskId])
}

model TaskDelaySubmission {
  id                     String       @id @default(uuid())
  taskId                 String
  task                   Task         @relation(fields: [taskId], references: [id], onDelete: Cascade)
  reason                 String       @db.Text
  expectedCompletionDate DateTime     @db.Date
  submittedAt            DateTime     @default(now()) @db.Timestamptz
  status                 ReviewStatus @default(PENDING)
  reviewedById           String?
  reviewedBy             User?        @relation("DelayReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedAt             DateTime?    @db.Timestamptz

  @@index([taskId])
}

model TaskPendingUpdate {
  id                      String       @id @default(uuid())
  taskId                  String
  task                    Task         @relation(fields: [taskId], references: [id], onDelete: Cascade)
  status                  String?      @db.VarChar(50)
  progressPercent         Int?
  workDone                String?      @db.Text
  comment                 String?      @db.Text
  issueDescription        String?      @db.Text
  timeSpentMinutes        Int?
  estimatedCompletionDate DateTime?    @db.Date
  submittedById           String
  submittedBy             User         @relation("PendingUpdateSubmitter", fields: [submittedById], references: [id], onDelete: Restrict)
  submittedByName         String       @db.VarChar(150)
  submittedAt             DateTime     @default(now()) @db.Timestamptz
  reviewStatus            ReviewStatus @default(PENDING)
  reviewedById            String?
  reviewedBy              User?        @relation("PendingUpdateReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedByName          String?      @db.VarChar(150)
  reviewedAt              DateTime?    @db.Timestamptz

  @@index([taskId])
}

model TaskUpdate {
  id              String   @id @default(uuid())
  taskId          String
  task            Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  authorId        String
  author          User     @relation("UpdateAuthor", fields: [authorId], references: [id], onDelete: Restrict)
  authorName      String   @db.VarChar(150)
  action          String   @db.VarChar(255)
  progressPercent Int?
  workDone        String?  @db.Text
  comment         String?  @db.Text
  createdAt       DateTime @default(now()) @db.Timestamptz

  @@index([taskId])
}

model TransferRequest {
  id            String       @id @default(uuid())
  taskId        String
  task          Task         @relation(fields: [taskId], references: [id], onDelete: Cascade)
  requestedById String
  requestedBy   User         @relation("TransferRequester", fields: [requestedById], references: [id], onDelete: Restrict)
  transferToId  String
  transferTo    User         @relation("TransferTarget", fields: [transferToId], references: [id], onDelete: Restrict)
  reason        String       @db.Text
  status        ReviewStatus @default(PENDING)
  reviewedById  String?
  reviewedBy    User?        @relation("TransferReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  createdAt     DateTime     @default(now()) @db.Timestamptz
  updatedAt     DateTime     @updatedAt @db.Timestamptz

  @@index([taskId])
}

// ==========================================
// 4. PERSONNEL, LOGS & LEAVE
// ==========================================

model WorkLog {
  id          String   @id @default(uuid())
  mongoId     String?  @unique
  employeeId  String
  employee    User     @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  date        DateTime @db.Date
  summary     String   @db.Text
  blockers    String?  @db.Text
  notes       String?  @db.Text
  submittedAt DateTime @default(now()) @db.Timestamptz
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  @@unique([employeeId, date])
  @@index([date])
}

model LeaveRequest {
  id              String      @id @default(uuid())
  mongoId         String?     @unique
  requestedById   String
  requestedBy     User        @relation("LeaveRequester", fields: [requestedById], references: [id], onDelete: Cascade)
  leaveFrom       DateTime    @db.Date
  leaveTo         DateTime    @db.Date
  leaveType       LeaveType   @default(CASUAL)
  reason          String      @db.Text
  status          LeaveStatus @default(PENDING)
  reviewedById    String?
  reviewedBy      User?       @relation("LeaveReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedAt      DateTime?   @db.Timestamptz
  rejectionReason String?     @db.Text
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  @@index([requestedById])
  @@index([leaveFrom, leaveTo])
  @@index([status])
}

// ==========================================
// 5. CLIENT CRM & PRODUCTION LOGISTICS
// ==========================================

model Client {
  id               String          @id @default(uuid())
  mongoId          String?         @unique
  name             String          @db.VarChar(150)
  description      String?         @db.Text
  deckLink         String?         @db.VarChar(2000)
  deliverablesLink String?         @db.VarChar(2000)
  contentLink      String?         @db.VarChar(2000)
  mouLink          String?         @db.VarChar(2000)
  isActive         Boolean         @default(true)
  createdById      String
  createdBy        User            @relation("ClientCreator", fields: [createdById], references: [id], onDelete: Restrict)
  createdAt        DateTime        @default(now()) @db.Timestamptz
  updatedAt        DateTime        @updatedAt @db.Timestamptz

  deliveries DeliveryEvent[]

  @@index([name])
}

model DeliveryEvent {
  id          String   @id @default(uuid())
  mongoId     String?  @unique
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  title       String   @db.VarChar(200)
  date        DateTime @db.Date
  description String?  @db.Text
  createdById String
  createdBy   User     @relation("DeliveryCreator", fields: [createdById], references: [id], onDelete: Restrict)
  createdAt   DateTime @default(now()) @db.Timestamptz

  @@index([clientId])
  @@index([date])
}

model Equipment {
  id            String            @id @default(uuid())
  mongoId       String?           @unique
  name          String            @db.VarChar(150)
  category      EquipmentCategory @default(OTHER)
  code          String?           @db.VarChar(50)
  notes         String?           @db.Text
  totalQuantity Int               @default(1)
  isActive      Boolean           @default(true)
  createdById   String
  createdBy     User              @relation("EquipmentCreator", fields: [createdById], references: [id], onDelete: Restrict)
  createdAt     DateTime          @default(now()) @db.Timestamptz
  updatedAt     DateTime          @updatedAt @db.Timestamptz

  shootItems ShootLogItem[]

  @@index([category])
  @@index([name])
}

model ShootLog {
  id           String         @id @default(uuid())
  mongoId      String?        @unique
  shootTitle   String         @db.VarChar(200)
  shootDate    DateTime       @db.Date
  location     String?        @db.VarChar(255)
  takenById    String
  takenBy      User           @relation("ShootLogTaker", fields: [takenById], references: [id], onDelete: Restrict)
  takenByName  String         @db.VarChar(150)
  takenByRole  String         @db.VarChar(50)
  status       ShootLogStatus @default(OUT)
  checkedOutAt DateTime       @default(now()) @db.Timestamptz
  returnedAt   DateTime?      @db.Timestamptz
  returnNote   String?        @db.Text
  createdAt    DateTime       @default(now()) @db.Timestamptz
  updatedAt    DateTime       @updatedAt @db.Timestamptz

  items ShootLogItem[]

  @@index([takenById])
  @@index([shootDate])
  @@index([status])
}

model ShootLogItem {
  id              String           @id @default(uuid())
  shootLogId      String
  shootLog        ShootLog         @relation(fields: [shootLogId], references: [id], onDelete: Cascade)
  equipmentId     String
  equipment       Equipment        @relation(fields: [equipmentId], references: [id], onDelete: Restrict)
  equipmentName   String           @db.VarChar(150)
  category        String           @db.VarChar(50)
  quantity        Int              @default(1)
  takeNote        String?          @db.Text
  returnCondition ReturnCondition?
  returnNote      String?          @db.Text

  @@index([shootLogId])
  @@index([equipmentId])
}

// ==========================================
// 6. REAL-TIME COMMS & NOTIFICATIONS
// ==========================================

model Conversation {
  id            String           @id @default(uuid())
  mongoId       String?          @unique
  type          ConversationType @default(DIRECT)
  title         String?          @db.VarChar(150)
  lastMessageAt DateTime         @default(now()) @db.Timestamptz
  createdAt     DateTime         @default(now()) @db.Timestamptz
  updatedAt     DateTime         @updatedAt @db.Timestamptz

  participants ConversationParticipant[]
  messages     Message[]

  @@index([lastMessageAt])
}

model ConversationParticipant {
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt       DateTime     @default(now()) @db.Timestamptz

  @@id([conversationId, userId])
}

model Message {
  id             String       @id @default(uuid())
  mongoId        String?      @unique
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation("MessageSender", fields: [senderId], references: [id], onDelete: Restrict)
  content        String       @db.Text
  createdAt      DateTime     @default(now()) @db.Timestamptz

  readReceipts MessageReadReceipt[]

  @@index([conversationId, createdAt])
}

model MessageReadReceipt {
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  readAt    DateTime @default(now()) @db.Timestamptz

  @@id([messageId, userId])
}

model Call {
  id            String        @id @default(uuid())
  mongoId       String?       @unique
  type          CallType      @default(DIRECT)
  callType      CallMediaType @default(VIDEO)
  initiatorId   String
  initiator     User          @relation("CallInitiator", fields: [initiatorId], references: [id], onDelete: Restrict)
  status        CallStatus    @default(RINGING)
  startedAt     DateTime      @default(now()) @db.Timestamptz
  endedAt       DateTime?     @db.Timestamptz
  createdAt     DateTime      @default(now()) @db.Timestamptz
  updatedAt     DateTime      @updatedAt @db.Timestamptz

  participants CallParticipant[]
  signals      CallSignal[]

  @@index([status])
}

model CallParticipant {
  callId   String
  call     Call      @relation(fields: [callId], references: [id], onDelete: Cascade)
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  status   String    @db.VarChar(50)
  joinedAt DateTime? @db.Timestamptz
  leftAt   DateTime? @db.Timestamptz

  @@id([callId, userId])
}

model CallSignal {
  id         String   @id @default(uuid())
  callId     String
  call       Call     @relation(fields: [callId], references: [id], onDelete: Cascade)
  fromUserId String
  fromUser   User     @relation("SignalSender", fields: [fromUserId], references: [id], onDelete: Cascade)
  toUserId   String
  toUser     User     @relation("SignalReceiver", fields: [toUserId], references: [id], onDelete: Cascade)
  type       String   @db.VarChar(50)
  payload    Json
  createdAt  DateTime @default(now()) @db.Timestamptz

  @@index([callId, toUserId])
}

model Meeting {
  id              String        @id @default(uuid())
  mongoId         String?       @unique
  title           String        @db.VarChar(200)
  description     String?       @db.Text
  scheduledAt     DateTime      @db.Timestamptz
  durationMinutes Int           @default(30)
  hostId          String
  host            User          @relation("MeetingHost", fields: [hostId], references: [id], onDelete: Restrict)
  status          MeetingStatus @default(SCHEDULED)
  createdAt       DateTime      @default(now()) @db.Timestamptz
  updatedAt       DateTime      @updatedAt @db.Timestamptz

  participants MeetingParticipant[]

  @@index([scheduledAt])
}

model MeetingParticipant {
  meetingId String
  meeting   Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    String   @default("INVITED") @db.VarChar(50)

  @@id([meetingId, userId])
}

model Notification {
  id            String           @id @default(uuid())
  mongoId       String?          @unique
  recipientId   String
  recipient     User             @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  title         String           @db.VarChar(255)
  message       String           @db.Text
  type          NotificationType @default(GENERAL)
  relatedTaskId String?
  relatedTask   Task?            @relation(fields: [relatedTaskId], references: [id], onDelete: SetNull)
  isRead        Boolean          @default(false)
  createdAt     DateTime         @default(now()) @db.Timestamptz

  @@index([recipientId, isRead])
}

// ==========================================
// 7. EMPLOYEE RECRUITMENT & ONBOARDING MODULE
// ==========================================

model Candidate {
  id                    String          @id @default(uuid())
  firstName             String          @db.VarChar(100)
  lastName              String          @db.VarChar(100)
  email                 String          @unique @db.VarChar(255)
  mobileNumber          String?         @db.VarChar(20)
  dateOfBirth           DateTime?       @db.Date
  residentialAddress    String?         @db.Text
  emergencyContactName  String?         @db.VarChar(100)
  emergencyContactPhone String?         @db.VarChar(20)
  emergencyContactRel   String?         @db.VarChar(50)
  designation           String          @db.VarChar(100)
  department            String          @db.VarChar(100)
  employmentType        EmploymentType  @default(EMPLOYEE)
  salaryOrStipend       Decimal         @default(0.00) @db.Decimal(12, 2)
  proposedJoiningDate   DateTime        @db.Date
  status                CandidateStatus @default(INVITED)

  // Token stored as a SHA-256 hash (never plain text)
  applicationTokenHash  String          @unique @db.VarChar(64)
  tokenExpiresAt        DateTime        @db.Timestamptz

  assignedToId          String
  assignedTo            User            @relation("CandidateOnboardingAssignee", fields: [assignedToId], references: [id], onDelete: Restrict)

  onboardingTaskId      String?         @unique
  onboardingTask        Task?           @relation("CandidateOnboardingTask", fields: [onboardingTaskId], references: [id], onDelete: SetNull)

  // Allocated employee ID from EmployeeIdRegistry
  allocatedEmployeeId   String?         @unique @db.VarChar(20)
  allocatedIdRef        EmployeeIdRegistry? @relation(fields: [allocatedEmployeeId], references: [employeeId])

  createdUserId         String?         @unique
  createdUser           User?           @relation("CandidateCreatedUser", fields: [createdUserId], references: [id], onDelete: SetNull)

  rejectionReason       String?         @db.Text
  correctionNotes       String?         @db.Text
  createdAt             DateTime        @default(now()) @db.Timestamptz
  updatedAt             DateTime        @updatedAt @db.Timestamptz

  identity     CandidateIdentity?
  bankDetails  CandidateBankDetails?
  documents    OnboardingDocument[]
  auditLogs    OnboardingAuditLog[]

  @@index([status])
  @@index([email])
  @@index([assignedToId])
}

model CandidateIdentity {
  id                   String    @id @default(uuid())
  candidateId          String    @unique
  candidate            Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  // AES-256-GCM encrypted strings
  aadhaarEncrypted     String    @db.Text
  aadhaarLastFour      String    @db.Char(4)
  aadhaarFrontR2Key    String    @db.VarChar(500)
  aadhaarBackR2Key     String    @db.VarChar(500)

  panEncrypted         String    @db.Text
  panLastFour          String    @db.Char(4)
  panFrontR2Key        String    @db.VarChar(500)

  photoR2Key           String    @db.VarChar(500)
  isVerified           Boolean   @default(false)
  verifiedById         String?
  verifiedBy           User?     @relation("IdentityVerifier", fields: [verifiedById], references: [id], onDelete: SetNull)
  verifiedAt           DateTime? @db.Timestamptz
  verificationNotes    String?   @db.Text
  createdAt            DateTime  @default(now()) @db.Timestamptz
  updatedAt            DateTime  @updatedAt @db.Timestamptz
}

model CandidateBankDetails {
  id                 String    @id @default(uuid())
  candidateId        String    @unique
  candidate          Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  accountHolderName  String    @db.VarChar(150)
  accountEncrypted   String    @db.Text
  accountLastFour    String    @db.VarChar(6)
  ifscCode           String    @db.VarChar(20)
  bankName           String    @db.VarChar(100)
  branchName         String    @db.VarChar(100)
  proofDocumentR2Key String    @db.VarChar(500)
  isVerified         Boolean   @default(false)
  verifiedById       String?
  verifiedBy         User?     @relation("BankVerifier", fields: [verifiedById], references: [id], onDelete: SetNull)
  verifiedAt         DateTime? @db.Timestamptz
  createdAt          DateTime  @default(now()) @db.Timestamptz
  updatedAt          DateTime  @updatedAt @db.Timestamptz
}

model OnboardingDocument {
  id              String            @id @default(uuid())
  candidateId     String
  candidate       Candidate         @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  documentType    OnboardingDocType
  version         Int               @default(1)
  generatedPdfKey String            @db.VarChar(500)
  signedPdfKey    String?           @db.VarChar(500)
  status          DocumentStatus    @default(GENERATED)
  sentAt          DateTime?         @db.Timestamptz
  signedAt        DateTime?         @db.Timestamptz
  verifiedAt      DateTime?         @db.Timestamptz
  verifiedById    String?
  verifiedBy      User?             @relation("DocumentVerifier", fields: [verifiedById], references: [id], onDelete: SetNull)
  rejectionReason String?           @db.Text
  createdAt       DateTime          @default(now()) @db.Timestamptz
  updatedAt       DateTime          @updatedAt @db.Timestamptz

  @@unique([candidateId, documentType, version])
  @@index([candidateId, documentType])
}

model OnboardingAuditLog {
  id             String    @id @default(uuid())
  candidateId    String
  candidate      Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  actorId        String?
  actor          User?     @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
  actorRole      String    @db.VarChar(50)
  action         String    @db.VarChar(100)
  previousStatus String?   @db.VarChar(50)
  newStatus      String?   @db.VarChar(50)
  comments       String?   @db.Text
  metadata       Json      @default("{}")
  createdAt      DateTime  @default(now()) @db.Timestamptz

  @@index([candidateId])
  @@index([createdAt])
}

model EmployeeIdRegistry {
  employeeId         String           @id @db.VarChar(20)
  designation        String           @db.VarChar(100)
  designationInitial String           @db.Char(1)
  allocatedToType    String           @db.VarChar(50)
  allocatedToId      String           @db.VarChar(64)
  allocatedAt        DateTime         @default(now()) @db.Timestamptz
  status             EmployeeIdStatus @default(ALLOCATED)

  candidate          Candidate?

  @@index([designationInitial])
}

model EmailOutbox {
  id          String       @id @default(uuid())
  recipient   String       @db.VarChar(255)
  subject     String       @db.VarChar(255)
  bodyText    String       @db.Text
  bodyHtml    String       @db.Text
  emailType   String       @db.VarChar(100)
  status      OutboxStatus @default(PENDING)
  retryCount  Int          @default(0)
  errorReason String?      @db.Text
  scheduledAt DateTime     @default(now()) @db.Timestamptz
  sentAt      DateTime?    @db.Timestamptz
  createdAt   DateTime     @default(now()) @db.Timestamptz
  updatedAt   DateTime     @updatedAt @db.Timestamptz

  @@index([status, scheduledAt])
}
```
