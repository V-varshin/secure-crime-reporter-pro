export type UserRole = 'victim' | 'authority';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  badgeId?: string;
  department?: string;
  createdAt: string;
}

export type CrimeCategory =
  | 'Theft'
  | 'Cybercrime'
  | 'Harassment'
  | 'Physical Assault'
  | 'Sexual Harassment'
  | 'Psycho Crime'
  | 'Property Crime'
  | 'Other / Unclassified';

export type SeverityLevel = 'Severe' | 'Moderate' | 'Normal / Low';

export type CaseStatus = 'Pending' | 'In Progress' | 'Closed';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  note?: string;
}

export interface CrimeReport {
  id: string; // Unique Complaint ID like CR-2026-XXXX
  victimId: string;
  victimName: string;
  victimPhone: string;
  victimEmail: string;
  title: string;
  description: string;
  category: CrimeCategory;
  severity: SeverityLevel;
  status: CaseStatus;
  incidentDate: string;
  incidentTime: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  audioUrl?: string;
  aiSuggestedCategory?: CrimeCategory;
  aiSuggestedSeverity?: SeverityLevel;
  aiExplanation?: string;
  aiAnalyzedAt?: string;
  isAiFallback?: boolean;
  assignedOfficer?: string;
  officerNotes?: string;
  auditLogs: AuditLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  complaintId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface ClassificationResult {
  category: CrimeCategory;
  severity: SeverityLevel;
  explanation: string;
  isFallback?: boolean;
}

export interface AuthorityOfficer {
  id: string;
  name: string;
  badgeId: string;
  department: string;
}
