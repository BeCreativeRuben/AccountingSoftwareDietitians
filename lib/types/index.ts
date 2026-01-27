/**
 * Diëtisten Accounting SaaS - TypeScript Type Definitions
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum InsuranceCompany {
  CHRISTELIJKE = 'Christelijke',
  LIBERALE = 'Liberale',
  SOLIDARIS = 'Solidaris',
  HELAN = 'Helan',
  VLAAMS_NEUTRAAL = 'Vlaams/Neutraal',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export enum RecurringFrequency {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  TRIMESTRIAL = 'trimestrial',
  YEARLY = 'yearly',
}

export enum SolidarisMedicalCondition {
  ALLERGIES = 'allergies',
  INTOLERANCES = 'intolerances',
  CHRONIC_KIDNEY_DISEASE = 'chronic_kidney_disease',
  EATING_DISORDER = 'eating_disorder',
  MALNUTRITION = 'malnutrition',
  OBESITY = 'obesity',
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  createdAt: Date;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  clinicName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface ClientDecrypted {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  notes?: string;
  insuranceCompany: InsuranceCompany;
  insuranceNumber?: string;
  medicalConditions?: SolidarisMedicalCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string; // ISO 8601
  insuranceCompany: InsuranceCompany;
  insuranceNumber?: string;
  medicalConditions?: SolidarisMedicalCondition[];
  notes?: string;
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export interface AppointmentType {
  id: string;
  userId: string;
  name: string;
  price: number;
  durationMinutes: number;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentDecrypted {
  id: string;
  userId: string;
  appointmentType: AppointmentType;
  clientIds: string[];
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface CreateAppointmentRequest {
  appointmentTypeId: string;
  clientIds: string[];
  startTime: string; // ISO 8601
  endTime: string;
  notes?: string;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export interface ExpenseCategory {
  id: string;
  userId: string;
  name: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  category: ExpenseCategory;
  description?: string;
  amount: number;
  expenseDate: Date;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringUntil?: Date;
  parentRecurringId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseRequest {
  categoryId: string;
  description?: string;
  amount: number;
  expenseDate: string; // ISO 8601
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringUntil?: string;
}

// ============================================================================
// INSURANCE REIMBURSEMENT TYPES
// ============================================================================

export interface InsuranceReimbursementTracker {
  id: string;
  clientId: string;
  insuranceCompany: InsuranceCompany;
  appointmentCountYtd: number;
  reimbursementAmountEligible: number;
  reimbursementAmountClaimed: number;
  isEligible: boolean;
  eligibilityReason: string;
  doctorAttestationRequired: boolean;
  doctorAttestationUploaded: boolean;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardSummary {
  income: {
    thisMonth: number;
    lastMonth: number;
    percentageChange: number;
    ytd: number;
  };
  expenses: {
    thisMonth: number;
    lastMonth: number;
    percentageChange: number;
    ytd: number;
  };
  profit: {
    thisMonth: number;
    lastMonth: number;
    percentageChange: number;
    ytd: number;
  };
  appointments: {
    thisMonth: number;
    lastMonth: number;
    byType: Record<string, number>;
  };
  insurance: {
    eligibleThisMonth: number;
    claimedYtd: number;
    clientsEligible: number;
  };
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface Settings {
  id: string;
  userId: string;
  darkMode: boolean;
  calendarIntegrationEnabled: boolean;
  appleCalendarEmail?: string;
  defaultAppointmentDurationMinutes: number;
  clientDataRetentionMonths: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  success: false;
  errors: ValidationError[];
}
