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
  recordField?: CareRecordField;
};
export type CareRecordField =
  "focus" | "subjective" | "objective" | "assessment" | "intervention" | "plan";
export type CareMeasurement = {
  kind:
    | "blood-pressure"
    | "temperature"
    | "pulse"
    | "spo2"
    | "meal"
    | "fluid"
    | "elimination";
  label: string;
  value: string;
};
export type StructuredCareRecord = {
  format: "F-SOAIP";
  focus: string[];
  subjective: string[];
  objective: string[];
  assessment: string[];
  intervention: string[];
  plan: string[];
  measurements: CareMeasurement[];
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
  source: "demo" | "sd-card";
  sourceName?: string;
  residentMatch?: "automatic" | "manual";
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
  structured?: StructuredCareRecord;
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
  kind?: "handoff" | "family";
  residentId?: string;
  recordingId?: string;
  updatedAt?: string;
};
export type MemoryNodeType = "person" | "place" | "event" | "time";
export type MemoryNode = {
  id: string;
  residentId: string;
  type: MemoryNodeType;
  label: string;
  normalizedLabel: string;
  firstSeenAt: string;
  lastSeenAt: string;
  mentionCount: number;
  episodeIds: string[];
};
export type MemoryEpisode = {
  id: string;
  residentId: string;
  recordingId: string;
  summary: string;
  sourceExcerpt: string;
  createdAt: string;
  approvedBy: string;
  nodeIds: string[];
};
export type MemoryEdge = {
  id: string;
  residentId: string;
  sourceNodeId: string;
  targetNodeId: string;
  weight: number;
  episodeIds: string[];
  firstSeenAt: string;
  lastSeenAt: string;
};
export type MemoryGraphMetrics = {
  nodeCount: number;
  edgeCount: number;
  largestConnectedComponent: number;
  averageDegree: number;
  nodeTypeDiversity: number;
  nodesByType: Record<MemoryNodeType, number>;
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
  memoryNodes: MemoryNode[];
  memoryEpisodes: MemoryEpisode[];
  memoryEdges: MemoryEdge[];
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
