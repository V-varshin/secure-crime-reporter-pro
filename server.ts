import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '25mb' }));

// Ensure data and upload directories exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Database file setup
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface UserRecord {
  id: string;
  role: 'victim' | 'authority';
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  salt: string;
  badgeId?: string;
  department?: string;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  note?: string;
}

interface CrimeReportRecord {
  id: string;
  victimId: string;
  victimName: string;
  victimPhone: string;
  victimEmail: string;
  title: string;
  description: string;
  category: string;
  severity: 'Severe' | 'Moderate' | 'Normal / Low';
  status: 'Pending' | 'In Progress' | 'Closed';
  incidentDate: string;
  incidentTime: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  audioUrl?: string;
  aiSuggestedCategory?: string;
  aiSuggestedSeverity?: 'Severe' | 'Moderate' | 'Normal / Low';
  aiExplanation?: string;
  aiAnalyzedAt?: string;
  isAiFallback?: boolean;
  assignedOfficer?: string;
  officerNotes?: string;
  auditLogs: AuditLogEntry[];
  createdAt: string;
  updatedAt: string;
}

interface ChatMessageRecord {
  id: string;
  complaintId: string;
  senderId: string;
  senderName: string;
  senderRole: 'victim' | 'authority';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface DatabaseSchema {
  users: UserRecord[];
  reports: CrimeReportRecord[];
  messages: ChatMessageRecord[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function initializeDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.users && parsed.reports && parsed.messages) {
        return parsed;
      }
    } catch {
      console.warn('Existing db.json corrupted or empty, reinitializing.');
    }
  }

  // Pre-seed realistic seed data
  const saltAuthority1 = generateSalt();
  const saltAuthority2 = generateSalt();
  const saltAuthority3 = generateSalt();
  const saltVictim1 = generateSalt();

  const seedUsers: UserRecord[] = [
    {
      id: 'usr_auth_1',
      role: 'authority',
      name: 'Officer Sarah Jenkins',
      email: 'officer@police.gov',
      phone: '+1-555-0101',
      passwordHash: hashPassword('authority123', saltAuthority1),
      salt: saltAuthority1,
      badgeId: 'AP-4892',
      department: 'Metropolitan Criminal Investigation Dept',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'usr_auth_2',
      role: 'authority',
      name: 'Detective Marcus Vance',
      email: 'marcus@police.gov',
      phone: '+1-555-0102',
      passwordHash: hashPassword('authority123', saltAuthority2),
      salt: saltAuthority2,
      badgeId: 'AP-5104',
      department: 'Cybercrime & Digital Forensics Unit',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'usr_auth_3',
      role: 'authority',
      name: 'Inspector Emily Chen',
      email: 'emily@police.gov',
      phone: '+1-555-0103',
      passwordHash: hashPassword('authority123', saltAuthority3),
      salt: saltAuthority3,
      badgeId: 'AP-3391',
      department: 'Special Victims & Harassment Cell',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'usr_vic_1',
      role: 'victim',
      name: 'Jane Doe',
      email: 'victim@example.com',
      phone: '+1-555-0199',
      passwordHash: hashPassword('victim123', saltVictim1),
      salt: saltVictim1,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];

  const seedReports: CrimeReportRecord[] = [
    {
      id: 'CR-2026-0812',
      victimId: 'usr_vic_1',
      victimName: 'Jane Doe',
      victimPhone: '+1-555-0199',
      victimEmail: 'victim@example.com',
      title: 'Armed Robbery and Physical Assault at Downtown Transit Hub',
      description: 'While walking toward the 5th Avenue Metro Entrance around 9:45 PM, two masked individuals brandished weapons, forcefully seized personal belongings, and physically assaulted me before fleeing south.',
      category: 'Physical Assault',
      severity: 'Severe',
      status: 'In Progress',
      incidentDate: '2026-10-22',
      incidentTime: '21:45',
      locationName: '5th Avenue Transit Entrance',
      address: '742 5th Avenue, Metro District, NY 10019',
      latitude: 40.7638,
      longitude: -73.9729,
      aiSuggestedCategory: 'Physical Assault',
      aiSuggestedSeverity: 'Severe',
      aiExplanation: 'Incident mentions physical violence, dangerous weapons, and robbery causing direct bodily harm.',
      aiAnalyzedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      assignedOfficer: 'Officer Sarah Jenkins',
      officerNotes: 'Surveillance footage subpoenaed from nearby subway station. Patrol dispatched to sweep perimeter.',
      auditLogs: [
        {
          id: 'aud_1',
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
          officerName: 'System',
          action: 'Complaint Registered',
        },
        {
          id: 'aud_2',
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          officerName: 'Officer Sarah Jenkins',
          action: 'Assigned Officer & Status Changed',
          field: 'status',
          previousValue: 'Pending',
          newValue: 'In Progress',
          note: 'Investigating transit camera feeds.',
        },
      ],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'CR-2026-0813',
      victimId: 'usr_vic_1',
      victimName: 'Jane Doe',
      victimPhone: '+1-555-0199',
      victimEmail: 'victim@example.com',
      title: 'Unauthorized Bank Wire & Crypto Phishing Cyber Attack',
      description: 'Received spoofed banking emails followed by automated credential compromise. Unauthorized transfers totaling $6,200 were executed to foreign crypto addresses without SMS OTP confirmation.',
      category: 'Cybercrime',
      severity: 'Moderate',
      status: 'Pending',
      incidentDate: '2026-10-23',
      incidentTime: '14:20',
      locationName: 'Online / Cyber Network',
      address: 'Reported from 120 Pine Street, Financial District',
      latitude: 40.7061,
      longitude: -74.0086,
      aiSuggestedCategory: 'Cybercrime',
      aiSuggestedSeverity: 'Moderate',
      aiExplanation: 'Digital financial fraud and credentials theft without immediate physical threat to life.',
      aiAnalyzedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      auditLogs: [
        {
          id: 'aud_3',
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          officerName: 'System',
          action: 'Complaint Registered',
        },
      ],
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'CR-2026-0814',
      victimId: 'usr_vic_2_seed',
      victimName: 'Robert Langdon',
      victimPhone: '+1-555-0188',
      victimEmail: 'robert@university.edu',
      title: 'Bicycle and Laptop Theft from Library Bike Stand',
      description: 'Locked Trek commuter bicycle and rear pannier bag containing Lenovo laptop were cut and stolen between 2:00 PM and 4:30 PM.',
      category: 'Theft',
      severity: 'Normal / Low',
      status: 'Closed',
      incidentDate: '2026-10-18',
      incidentTime: '15:30',
      locationName: 'University Central Library',
      address: '535 W 114th St, Morningside Heights, NY 10027',
      latitude: 40.8064,
      longitude: -73.9632,
      aiSuggestedCategory: 'Theft',
      aiSuggestedSeverity: 'Normal / Low',
      aiExplanation: 'Property theft with no bodily harm or weapon reported.',
      aiAnalyzedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      assignedOfficer: 'Detective Marcus Vance',
      officerNotes: 'Bicycle recovered at local pawn exchange and returned to victim. Suspect cited.',
      auditLogs: [
        {
          id: 'aud_4',
          timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
          officerName: 'System',
          action: 'Complaint Registered',
        },
        {
          id: 'aud_5',
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          officerName: 'Detective Marcus Vance',
          action: 'Status Changed to Closed',
          field: 'status',
          previousValue: 'In Progress',
          newValue: 'Closed',
          note: 'Property recovered and returned.',
        },
      ],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'CR-2026-0815',
      victimId: 'usr_vic_3_seed',
      victimName: 'Elena Rostova',
      victimPhone: '+1-555-0177',
      victimEmail: 'elena@arts.org',
      title: 'Persistent In-Person Stalking and Threatening Communications',
      description: 'Individual has been following me from workplace to residence for five consecutive evenings, photographing windows and leaving threatening notes at my door.',
      category: 'Harassment',
      severity: 'Severe',
      status: 'Pending',
      incidentDate: '2026-10-24',
      incidentTime: '20:10',
      locationName: 'Residential Entrance',
      address: '320 West 85th Street, Upper West Side, NY 10024',
      latitude: 40.7877,
      longitude: -73.9791,
      aiSuggestedCategory: 'Harassment',
      aiSuggestedSeverity: 'Severe',
      aiExplanation: 'Escalating stalking behavior with direct domestic boundary breach and explicit threats of harm.',
      aiAnalyzedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      auditLogs: [
        {
          id: 'aud_6',
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          officerName: 'System',
          action: 'Complaint Registered - Flagged for Urgent Authority Review',
        },
      ],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'CR-2026-0816',
      victimId: 'usr_vic_4_seed',
      victimName: 'David Miller',
      victimPhone: '+1-555-0166',
      victimEmail: 'david.m@construct.com',
      title: 'Vandalism and Commercial Storefront Graffiti Damage',
      description: 'Graffiti tagging and broken front display window at retail storefront overnight. No entry gained.',
      category: 'Property Crime',
      severity: 'Normal / Low',
      status: 'In Progress',
      incidentDate: '2026-10-24',
      incidentTime: '03:15',
      locationName: 'Retail Commercial Strip',
      address: '154 Columbus Ave, Upper West Side, NY 10023',
      latitude: 40.7742,
      longitude: -73.9806,
      aiSuggestedCategory: 'Property Crime',
      aiSuggestedSeverity: 'Normal / Low',
      aiExplanation: 'Vandalism with property damage, no occupant injury.',
      aiAnalyzedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      assignedOfficer: 'Inspector Emily Chen',
      officerNotes: 'Reviewing neighborhood street security cameras.',
      auditLogs: [
        {
          id: 'aud_7',
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          officerName: 'Inspector Emily Chen',
          action: 'Assigned Case',
        },
      ],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const seedMessages: ChatMessageRecord[] = [
    {
      id: 'msg_1',
      complaintId: 'CR-2026-0812',
      senderId: 'usr_vic_1',
      senderName: 'Jane Doe',
      senderRole: 'victim',
      text: 'Hello Officer, thank you for taking this report. I have the medical report from the urgent care clinic if you need it.',
      timestamp: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg_2',
      complaintId: 'CR-2026-0812',
      senderId: 'usr_auth_1',
      senderName: 'Officer Sarah Jenkins',
      senderRole: 'authority',
      text: 'Hello Jane, yes please keep the documentation handy. We have requested the high-resolution transit camera tape. Are you in a safe location right now?',
      timestamp: new Date(Date.now() - 2 * 86400000 + 5400000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg_3',
      complaintId: 'CR-2026-0812',
      senderId: 'usr_vic_1',
      senderName: 'Jane Doe',
      senderRole: 'victim',
      text: 'Yes, I am currently home with family. Please let me know as soon as the video footage is reviewed.',
      timestamp: new Date(Date.now() - 2 * 86400000 + 7200000).toISOString(),
      status: 'delivered',
    },
  ];

  const db: DatabaseSchema = {
    users: seedUsers,
    reports: seedReports,
    messages: seedMessages,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  return db;
}

const db = initializeDatabase();

function saveDatabase(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// Simple in-memory session token store: token -> user
const sessions = new Map<string, UserRecord>();

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }
  const token = authHeader.split(' ')[1];
  const user = sessions.get(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired session' });
  }
  (req as any).user = user;
  next();
}

// ========================
// AUTHENTICATION ROUTES
// ========================

// Register Victim
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields (name, email, phone, password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      role: 'victim',
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase();

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, newUser);

    const safeUser = {
      id: newUser.id,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({ token, user: safeUser, message: 'Victim registration successful.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Registration failed.' });
  }
});

// Login for both Victim and Authority (validates role segregation)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, requiredRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email credentials.' });
    }

    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).json({
        error: `Access denied. This portal is for ${requiredRole} accounts only.`,
      });
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid password credentials.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, user);

    const safeUser = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      badgeId: user.badgeId,
      department: user.department,
      createdAt: user.createdAt,
    };

    return res.json({ token, user: safeUser, message: 'Login successful.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed.' });
  }
});

// Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user as UserRecord;
  res.json({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    badgeId: user.badgeId,
    department: user.department,
    createdAt: user.createdAt,
  });
});

// List Available Authority Officers (for assignment)
app.get('/api/auth/authorities', authMiddleware, (req, res) => {
  const authorities = db.users
    .filter((u) => u.role === 'authority')
    .map((u) => ({
      id: u.id,
      name: u.name,
      badgeId: u.badgeId || 'N/A',
      department: u.department || 'Police Department',
    }));
  res.json(authorities);
});

// ========================
// FILE UPLOAD ROUTE
// ========================
app.post('/api/upload', (req, res) => {
  try {
    const { data, filename, mimeType } = req.body;
    if (!data || !filename || !mimeType) {
      return res.status(400).json({ error: 'Missing upload payload (data, filename, mimeType).' });
    }

    // Validate mime types: images (jpeg, png, webp, gif) and audio (mp3, wav, webm, m4a, ogg)
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedAudioMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'];

    const isImage = allowedImageMimes.includes(mimeType);
    const isAudio = allowedAudioMimes.includes(mimeType) || mimeType.startsWith('audio/');

    if (!isImage && !isAudio) {
      return res.status(400).json({ error: 'File type not allowed. Supported formats: JPG, PNG, WEBP, MP3, WAV, WEBM.' });
    }

    // Decode base64
    const base64Data = data.includes(';base64,') ? data.split(';base64,')[1] : data;
    const buffer = Buffer.from(base64Data, 'base64');

    // Limit to 15MB
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds the 15MB limit.' });
    }

    const ext = path.extname(filename) || (isImage ? '.jpg' : '.webm');
    const safeName = `evidence_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const targetPath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    return res.status(201).json({
      url: publicUrl,
      size: buffer.length,
      mimeType,
      isImage,
      isAudio,
      message: 'File uploaded successfully.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'File upload failed.' });
  }
});

// ========================
// AI CLASSIFICATION & SEVERITY
// ========================
const VALID_CATEGORIES = [
  'Theft',
  'Cybercrime',
  'Harassment',
  'Physical Assault',
  'Sexual Harassment',
  'Psycho Crime',
  'Property Crime',
  'Other / Unclassified',
];

function ruleBasedClassification(title: string, desc: string): { category: string; severity: 'Severe' | 'Moderate' | 'Normal / Low'; explanation: string } {
  const text = `${title} ${desc}`.toLowerCase();

  // Severe criteria: physical violence, weapons, life threats, severe trauma
  if (
    text.includes('assault') ||
    text.includes('weapon') ||
    text.includes('gun') ||
    text.includes('knife') ||
    text.includes('kill') ||
    text.includes('blood') ||
    text.includes('hostage') ||
    text.includes('rape') ||
    text.includes('sexual') ||
    text.includes('stalk') ||
    text.includes('death threat')
  ) {
    let cat = 'Physical Assault';
    if (text.includes('sexual') || text.includes('rape') || text.includes('molest')) {
      cat = 'Sexual Harassment';
    } else if (text.includes('stalk') || text.includes('threaten')) {
      cat = 'Harassment';
    } else if (text.includes('delusion') || text.includes('psychological') || text.includes('bizarre harassment')) {
      cat = 'Psycho Crime';
    }
    return {
      category: cat,
      severity: 'Severe',
      explanation: 'Detected indicators of immediate physical danger, weapons, or severe boundary violation.',
    };
  }

  // Cybercrime
  if (
    text.includes('hack') ||
    text.includes('cyber') ||
    text.includes('phishing') ||
    text.includes('crypto') ||
    text.includes('malware') ||
    text.includes('ransomware') ||
    text.includes('account stolen') ||
    text.includes('wire fraud') ||
    text.includes('otp')
  ) {
    const isMajor = text.includes('large sum') || text.includes('thousands') || text.includes('ransom');
    return {
      category: 'Cybercrime',
      severity: isMajor ? 'Moderate' : 'Normal / Low',
      explanation: 'Involves unauthorized digital system access, phishing, or online financial extortion.',
    };
  }

  // Theft & Property
  if (text.includes('stole') || text.includes('theft') || text.includes('robbery') || text.includes('burglar')) {
    return {
      category: 'Theft',
      severity: text.includes('armed') || text.includes('break-in') ? 'Moderate' : 'Normal / Low',
      explanation: 'Involves unlawful taking of personal property.',
    };
  }

  if (text.includes('vandal') || text.includes('damage') || text.includes('graffiti') || text.includes('property')) {
    return {
      category: 'Property Crime',
      severity: 'Normal / Low',
      explanation: 'Reports unlawful property damage or trespassing without bodily harm.',
    };
  }

  if (text.includes('harass') || text.includes('bully') || text.includes('threat') || text.includes('intimidation')) {
    return {
      category: 'Harassment',
      severity: 'Moderate',
      explanation: 'Involves repeated distressing, intimidating, or verbal abuse actions.',
    };
  }

  return {
    category: 'Other / Unclassified',
    severity: 'Normal / Low',
    explanation: 'General incident reported. Requires manual review by intake officer.',
  };
}

app.post('/api/classify', async (req, res) => {
  const { title = '', description = '' } = req.body;
  if (!title && !description) {
    return res.status(400).json({ error: 'Title or description required for classification analysis.' });
  }

  // If Gemini API is configured, use Gemini 3.8 Flash
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a forensic law enforcement triage assistant evaluating a crime incident report.
Analyze the following crime title and description:
Title: "${title}"
Description: "${description}"

Categories available:
- Theft
- Cybercrime
- Harassment
- Physical Assault
- Sexual Harassment
- Psycho Crime
- Property Crime
- Other / Unclassified

Severity levels available:
- Severe (Direct bodily threat, weapons, armed robbery, severe stalking/harm)
- Moderate (Financial extortion, non-violent burglary, repeated harassment)
- Normal / Low (Minor property theft, graffiti, low urgency incidents)

Provide a preliminary suggestion for law enforcement review. Avoid ungrounded psychiatric assumptions regarding "Psycho Crime".

Return JSON with exactly these keys:
{
  "category": "One of the exact category names above",
  "severity": "Severe" | "Moderate" | "Normal / Low",
  "explanation": "Brief 1-2 sentence forensic reasoning for this preliminary triage"
}`;

      const aiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              severity: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['category', 'severity', 'explanation'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 4000)
      );

      const aiResponse = await Promise.race([aiCall, timeoutPromise]);

      const parsed = JSON.parse(aiResponse.text || '{}');
      const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'Other / Unclassified';
      const severity = ['Severe', 'Moderate', 'Normal / Low'].includes(parsed.severity)
        ? parsed.severity
        : 'Normal / Low';

      return res.json({
        category,
        severity,
        explanation: parsed.explanation || 'AI preliminary classification completed for authority review.',
        isFallback: false,
      });
    } catch (aiErr: any) {
      console.warn('Gemini AI call failed or timed out, utilizing fallback:', aiErr?.message);
    }
  }

  // Graceful rule-based fallback
  const fallback = ruleBasedClassification(title, description);
  return res.json({
    category: fallback.category,
    severity: fallback.severity,
    explanation: `${fallback.explanation} (Preliminary rule-based analysis; subject to authority review)`,
    isFallback: true,
  });
});

// ========================
// CRIME REPORTS CRUD
// ========================

// GET Reports (Filtered by role: victims see only their reports; authorities see all)
app.get('/api/reports', authMiddleware, (req, res) => {
  const user = (req as any).user as UserRecord;
  let reports = [...db.reports];

  if (user.role === 'victim') {
    reports = reports.filter((r) => r.victimId === user.id || r.victimEmail.toLowerCase() === user.email.toLowerCase());
  }

  // Sort newest first
  reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(reports);
});

// GET Single Report
app.get('/api/reports/:id', authMiddleware, (req, res) => {
  const user = (req as any).user as UserRecord;
  const report = db.reports.find((r) => r.id === req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  // Victims can only access their own report
  if (user.role === 'victim' && report.victimId !== user.id && report.victimEmail.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied: You are not authorized to view this complaint.' });
  }

  res.json(report);
});

// POST Create Report (Victim submission)
app.post('/api/reports', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as UserRecord;
    const {
      title,
      description,
      category,
      severity,
      incidentDate,
      incidentTime,
      locationName,
      address,
      latitude,
      longitude,
      imageUrl,
      audioUrl,
      victimName,
      victimPhone,
      victimEmail,
      aiSuggestedCategory,
      aiSuggestedSeverity,
      aiExplanation,
    } = req.body;

    if (!title || !description || !incidentDate) {
      return res.status(400).json({ error: 'Title, description, and incident date are required.' });
    }

    // Generate unique complaint ID: CR-YEAR-RANDOM
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const complaintId = `CR-${currentYear}-${randomSuffix}`;

    const reportCategory = category || aiSuggestedCategory || 'Other / Unclassified';
    const reportSeverity = severity || aiSuggestedSeverity || 'Normal / Low';

    const newReport: CrimeReportRecord = {
      id: complaintId,
      victimId: user.id,
      victimName: victimName || user.name,
      victimPhone: victimPhone || user.phone,
      victimEmail: victimEmail || user.email,
      title: title.trim(),
      description: description.trim(),
      category: reportCategory,
      severity: reportSeverity,
      status: 'Pending',
      incidentDate,
      incidentTime: incidentTime || '12:00',
      locationName: locationName || 'Reported Location',
      address: address || 'Location coordinates pinned on map',
      latitude: Number(latitude) || 40.7128,
      longitude: Number(longitude) || -74.006,
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      aiSuggestedCategory: aiSuggestedCategory || undefined,
      aiSuggestedSeverity: aiSuggestedSeverity || undefined,
      aiExplanation: aiExplanation || undefined,
      aiAnalyzedAt: aiSuggestedCategory ? new Date().toISOString() : undefined,
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          officerName: 'Intake System',
          action: 'Complaint Filed by Victim',
          note: `Severity: ${reportSeverity}, Category: ${reportCategory}`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.reports.unshift(newReport);
    saveDatabase();

    // Broadcast new complaint event to active authorities via WebSocket
    broadcastToRole('authority', {
      type: 'new_complaint',
      report: newReport,
    });

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      report: newReport,
      complaintId: newReport.id,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to submit crime report.' });
  }
});

// PATCH Update Report (Authority only: update status, severity, category, assign officer, notes)
app.patch('/api/reports/:id', authMiddleware, (req, res) => {
  const user = (req as any).user as UserRecord;

  if (user.role !== 'authority') {
    return res.status(403).json({ error: 'Permission denied: Only authorized authorities can update complaint status and assignments.' });
  }

  const report = db.reports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const { status, severity, category, assignedOfficer, officerNotes, auditAction } = req.body;
  const now = new Date().toISOString();

  // Audit entry builder
  if (status && status !== report.status) {
    report.auditLogs.push({
      id: `aud_${Date.now()}_status`,
      timestamp: now,
      officerName: user.name,
      action: 'Case Status Changed',
      field: 'status',
      previousValue: report.status,
      newValue: status,
      note: auditAction || `Status updated from ${report.status} to ${status}`,
    });
    report.status = status;
  }

  if (severity && severity !== report.severity) {
    report.auditLogs.push({
      id: `aud_${Date.now()}_sev`,
      timestamp: now,
      officerName: user.name,
      action: 'Severity Level Reclassified',
      field: 'severity',
      previousValue: report.severity,
      newValue: severity,
    });
    report.severity = severity;
  }

  if (category && category !== report.category) {
    report.auditLogs.push({
      id: `aud_${Date.now()}_cat`,
      timestamp: now,
      officerName: user.name,
      action: 'Crime Category Reclassified',
      field: 'category',
      previousValue: report.category,
      newValue: category,
    });
    report.category = category;
  }

  if (assignedOfficer !== undefined && assignedOfficer !== report.assignedOfficer) {
    report.auditLogs.push({
      id: `aud_${Date.now()}_officer`,
      timestamp: now,
      officerName: user.name,
      action: 'Officer Assigned',
      field: 'assignedOfficer',
      previousValue: report.assignedOfficer || 'Unassigned',
      newValue: assignedOfficer,
    });
    report.assignedOfficer = assignedOfficer;
  }

  if (officerNotes !== undefined) {
    report.officerNotes = officerNotes;
  }

  report.updatedAt = now;
  saveDatabase();

  // Broadcast update to complaint room
  broadcastToRoom(report.id, {
    type: 'report_updated',
    report,
  });

  res.json({ message: 'Complaint updated successfully.', report });
});

// ========================
// MESSAGES / PRIVATE CHAT
// ========================
app.get('/api/reports/:id/messages', authMiddleware, (req, res) => {
  const user = (req as any).user as UserRecord;
  const report = db.reports.find((r) => r.id === req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  if (user.role === 'victim' && report.victimId !== user.id && report.victimEmail.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied: You cannot view messages for this case.' });
  }

  const messages = db.messages
    .filter((m) => m.complaintId === req.params.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json(messages);
});

app.post('/api/reports/:id/messages', authMiddleware, (req, res) => {
  const user = (req as any).user as UserRecord;
  const report = db.reports.find((r) => r.id === req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  if (user.role === 'victim' && report.victimId !== user.id && report.victimEmail.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied: You cannot send messages for this case.' });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text cannot be empty.' });
  }

  const newMessage: ChatMessageRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    complaintId: req.params.id,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    text: text.trim(),
    timestamp: new Date().toISOString(),
    status: 'delivered',
  };

  db.messages.push(newMessage);
  saveDatabase();

  // Broadcast to room
  broadcastToRoom(req.params.id, {
    type: 'chat_message',
    message: newMessage,
  });

  res.status(201).json(newMessage);
});

// ========================
// WEBSOCKET & WEBRTC SIGNALING
// ========================
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Track client connection metadata
interface ClientConnection {
  ws: WebSocket;
  complaintId?: string;
  userId?: string;
  role?: 'victim' | 'authority';
  userName?: string;
}

const activeClients = new Set<ClientConnection>();

function broadcastToRoom(complaintId: string, payload: any, senderWs?: WebSocket) {
  const data = JSON.stringify(payload);
  for (const client of activeClients) {
    if (client.complaintId === complaintId && client.ws.readyState === WebSocket.OPEN) {
      if (!senderWs || client.ws !== senderWs) {
        client.ws.send(data);
      }
    }
  }
}

function broadcastToRole(role: 'victim' | 'authority', payload: any) {
  const data = JSON.stringify(payload);
  for (const client of activeClients) {
    if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  const client: ClientConnection = { ws };
  activeClients.add(client);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'join_room':
          client.complaintId = msg.complaintId;
          client.userId = msg.userId;
          client.role = msg.role;
          client.userName = msg.userName;
          // Notify peer in room of presence
          broadcastToRoom(
            msg.complaintId,
            {
              type: 'peer_joined',
              userId: msg.userId,
              userName: msg.userName,
              role: msg.role,
            },
            ws
          );
          break;

        case 'chat_message':
          if (client.complaintId) {
            broadcastToRoom(client.complaintId, msg, ws);
          }
          break;

        // WebRTC Signaling messages
        case 'call_initiate':
        case 'call_offer':
        case 'call_answer':
        case 'ice_candidate':
        case 'call_reject':
        case 'call_end':
        case 'media_state_change':
          if (client.complaintId) {
            broadcastToRoom(client.complaintId, msg, ws);
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (client.complaintId && client.userId) {
      broadcastToRoom(client.complaintId, {
        type: 'peer_left',
        userId: client.userId,
        userName: client.userName,
      });
    }
    activeClients.delete(client);
  });
});

// ========================
// VITE / STATIC INTEGRATION
// ========================
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Smart Crime Reporting System running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
