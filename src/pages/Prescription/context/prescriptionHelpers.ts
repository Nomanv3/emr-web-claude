/**
 * Prescription Context helpers — API integration, template CRUD, data collection.
 * Extracted to keep PrescriptionContext.tsx under 400 lines.
 */
import { prescriptionApi, templatesApi, printSettingsApi } from '@/services/api';
import type {
  DropdownOptions, PrescriptionTemplate, PatientInfo,
  PrescriptionVitals, Vitals, Symptom, Diagnosis, Medication,
  LabInvestigation, LabResult, ExaminationFinding, ProcedureEntry,
  FollowUp, Referral, CustomSection, PrescriptionLanguage,
} from '@/types';
import type { MedicalCondition, SectionId } from './PrescriptionContext';

// ─── Dev IDs ────────────────────────────────────────────────────────
export const DEV_ORG = 'org-001';
export const DEV_BRANCH = 'branch-001';
export const DEV_DOCTOR = 'dev-doctor-001';

// ─── API Fetchers ───────────────────────────────────────────────────

export async function fetchDropdownOptions(): Promise<DropdownOptions | null> {
  try {
    const res = await prescriptionApi.getDropdownOptions();
    return res.data || null;
  } catch (e) {
    console.error('[Prescription] Failed to fetch dropdown options:', e);
    return null;
  }
}

export async function fetchConfiguration() {
  try {
    const res = await prescriptionApi.getConfiguration({
      organization_id: DEV_ORG,
      branch_id: DEV_BRANCH,
    });
    return res.data || null;
  } catch (e) {
    console.error('[Prescription] Failed to fetch configuration:', e);
    return null;
  }
}

export async function fetchAllTemplates(): Promise<PrescriptionTemplate[]> {
  try {
    const res = await templatesApi.getTemplates({
      organization_id: DEV_ORG,
      branch_id: DEV_BRANCH,
    });
    // Response may be { templates: [...] } or directly an array
    const data = res.data as unknown;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'templates' in data) {
      return (data as { templates: PrescriptionTemplate[] }).templates;
    }
    return [];
  } catch (e) {
    console.error('[Prescription] Failed to fetch templates:', e);
    return [];
  }
}

export async function fetchPatientDetail(patientId: string): Promise<{
  patientInfo: PatientInfo;
  lockedVitals: PrescriptionVitals | null;
  medicalHistory: MedicalCondition[];
} | null> {
  try {
    const res = await prescriptionApi.getPatientDetailHistory(patientId);
    const d = res.data;
    if (!d) return null;
    return {
      patientInfo: {
        name: d.fullName || '',
        age: d.ageDisplay || '',
        gender: d.genderDisplay || '',
        phone: d.phoneDisplay || '',
        address: d.rawData?.address || '',
      },
      lockedVitals: d.lockedVitals || null,
      medicalHistory: (d.medicalHistory || []).map((h) => ({
        name: h.condition_name || (h as Record<string, unknown>).name as string || '',
        value: (h.value === 1 ? 'Y' : h.value === 0 ? 'N' : '-') as 'Y' | 'N' | '-',
        since: h.since || '',
      })),
    };
  } catch (e) {
    console.error('[Prescription] Failed to fetch patient detail:', e);
    return null;
  }
}

export async function fetchPrintSettingsData(): Promise<Record<string, boolean> | null> {
  try {
    const res = await printSettingsApi.getSettings({
      organization_id: DEV_ORG,
      branch_id: DEV_BRANCH,
    });
    const data = res.data as Record<string, unknown> | null;
    // Backend stores under "settings" key
    if (data && typeof data === 'object' && 'settings' in data) {
      return data.settings as Record<string, boolean>;
    }
    return null;
  } catch (e) {
    console.error('[Prescription] Failed to fetch print settings:', e);
    return null;
  }
}

export async function savePrintSettingsData(settings: Record<string, boolean>): Promise<boolean> {
  try {
    const payload = {
      organizationId: DEV_ORG,
      branchId: DEV_BRANCH,
      settings,
    };
    console.log('[PrintSettings] Saving payload:', JSON.stringify(payload).slice(0, 200));
    const result = await printSettingsApi.saveSettings(payload);
    console.log('[PrintSettings] Save result:', result);
    return true;
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: unknown }; message?: string };
    console.error('[PrintSettings] Save failed:', err.response?.status, err.response?.data, err.message);
    return false;
  }
}

// ─── Template CRUD ──────────────────────────────────────────────────

export async function createSectionTemplate(
  name: string,
  type: string,
  items: Record<string, unknown>[]
): Promise<string | null> {
  try {
    const res = await templatesApi.createTemplate({
      organization_id: DEV_ORG,
      branch_id: DEV_BRANCH,
      doctor_id: DEV_DOCTOR,
      name,
      type,
      items,
      created_by: DEV_DOCTOR,
      updated_by: DEV_DOCTOR,
    });
    const data = res.data as Record<string, unknown>;
    return (data?.template_id as string) || (data?.templateId as string) || null;
  } catch (e) {
    console.error(`[Prescription] Failed to create ${type} template:`, e);
    return null;
  }
}

export async function deleteSectionTemplate(templateId: string, templateType: string): Promise<boolean> {
  try {
    await templatesApi.deleteTemplate({
      organization_id: DEV_ORG,
      branch_id: DEV_BRANCH,
      template_id: templateId,
      template_type: templateType,
    });
    return true;
  } catch (e) {
    console.error(`[Prescription] Failed to delete template ${templateId}:`, e);
    return false;
  }
}

export async function fetchSingleTemplate(templateId: string, type: string): Promise<PrescriptionTemplate | null> {
  try {
    const res = await templatesApi.getTemplates({
      organization_id: DEV_ORG,
      branch_id: DEV_BRANCH,
      template_id: templateId,
      type,
    });
    return (res.data as unknown as PrescriptionTemplate) || null;
  } catch (e) {
    console.error(`[Prescription] Failed to fetch template ${templateId}:`, e);
    return null;
  }
}

// ─── Data Collection ────────────────────────────────────────────────

export interface CollectedPrescriptionData {
  vitals: Vitals;
  symptoms: Symptom[];
  diagnoses: Diagnosis[];
  examinationFindings: ExaminationFinding[];
  medications: Medication[];
  labInvestigations: LabInvestigation[];
  labResults: LabResult[];
  procedures: ProcedureEntry[];
  followUp: FollowUp | null;
  referral: Referral | null;
  advice: string;
  notes: { surgicalNotes: string; privateNotes: string };
  customSections: CustomSection[];
  medicalConditions: MedicalCondition[];
  noRelevantHistory: boolean;
  language: PrescriptionLanguage;
  sectionConfig: { enabledSections: SectionId[]; sectionOrder: SectionId[] };
}

export function buildSubmitPayload(
  data: CollectedPrescriptionData,
  patientId: string | null,
  prescriptionId?: string | null,
) {
  return {
    organizationId: DEV_ORG,
    branchId: DEV_BRANCH,
    doctorId: DEV_DOCTOR,
    patientId,
    ...(prescriptionId ? { prescriptionId } : {}),
    visitDate: new Date().toISOString(),
    vitals: data.vitals,
    symptoms: data.symptoms,
    diagnoses: data.diagnoses,
    examinationFindings: data.examinationFindings,
    medications: data.medications,
    labInvestigations: data.labInvestigations,
    labResults: data.labResults,
    procedures: data.procedures,
    followUp: data.followUp,
    referral: data.referral,
    advice: data.advice,
    notes: data.notes,
    customSections: data.customSections,
    sectionConfig: data.sectionConfig,
    language: data.language,
    created_by: DEV_DOCTOR,
  };
}
