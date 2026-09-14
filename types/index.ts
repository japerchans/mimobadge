export type Approval = "pending" | "approved" | "edited" | "rejected";
export type Resident = {
  id: string;
  name: string;
  kana: string;
  age: number;
  room: string;
  caregiverId: string;
  since: string;
  initials: string;
};
export type Caregiver = {
  id: string;
  name: string;
  role: string;
  badge: string;
  shift: string;
};
export type Segment = {
  speaker: "caregiver" | "resident";
  start: number;
  end: number;
  text: string;
};
export type Proposal = {
  id: string;
  kind: "care" | "profile" | "ignored";
  category: string;
  content: string;
  evidence: string;
  status: Approval;
  originalContent?: string;
};
export type Recording = {
  id: string;
  residentId: string | null;
  caregiverId: string;
  createdAt: string;
  duration: number;
  status: "received" | "processing" | "review" | "completed" | "failed";
  stage: number;
  transcript: Segment[];
  proposals: Proposal[];
  draft: string;
  context: string[];
  error?: string;
  source: "demo";
  retentionUntil: string;
  revision: number;
};
export type Information = {
  id: string;
  residentId: string;
  recordingId: string;
  kind: "care" | "profile";
  category: string;
  content: string;
  evidence: string;
  createdAt: string;
  updatedAt: string;
  approvedBy: string;
  status: "approved" | "edited";
  history: { content: string; date: string; source: string }[];
};
export type CareRecord = {
  id: string;
  residentId: string;
  recordingId: string;
  content: string;
  createdAt: string;
  approvedBy: string;
};
export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
};
export type Handoff = {
  id: string;
  createdAt: string;
  createdBy: string;
  content: string;
};
export type Workspace = {
  facility: { id: string; name: string };
  residents: Resident[];
  caregivers: Caregiver[];
  recordings: Recording[];
  information: Information[];
  records: CareRecord[];
  audit: AuditLog[];
  handoffs: Handoff[];
};
export type Session = {
  facilityId: string;
  userId: string;
  role: "caregiver" | "viewer";
  expires: number;
};
export type WorkspaceResponse = Workspace & {
  session: Session;
  storage: "postgresql" | "local-demo";
};
