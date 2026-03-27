import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Grid,
  Divider,
} from '@mui/material';
import {
  MonitorHeart as ConditionIcon,
  Warning as AllergyIcon,
  LocalHospital as SurgeryIcon,
  FamilyRestroom as FamilyIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { patientApi } from '@/services/api';
import type { PatientMedicalHistory } from '@/types';

interface MedicalHistoryTabProps {
  patientId: string;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      {icon}
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );
}

function SkeletonTable() {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={40} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
      {text}
    </Typography>
  );
}

function severityColor(severity: string): 'error' | 'warning' | 'default' {
  if (severity === 'Severe' || severity === 'High') return 'error';
  if (severity === 'Moderate' || severity === 'Medium') return 'warning';
  return 'default';
}

export default function MedicalHistoryTab({ patientId }: MedicalHistoryTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['patientHistory', patientId],
    queryFn: () => patientApi.getPatientHistory(patientId),
  });

  const history = data?.data as PatientMedicalHistory | undefined;

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Skeleton width={160} height={28} sx={{ mb: 2 }} />
              <SkeletonTable />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!history || history.noHistory) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No medical history recorded for this patient.
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Chronic Conditions */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <SectionHeader icon={<ConditionIcon color="primary" />} title="Chronic Conditions" />
          <Divider sx={{ mb: 1 }} />
          {history.conditions.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Condition</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Since</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.conditions
                    .filter((c) => c.value === 'Y')
                    .map((condition) => (
                      <TableRow key={condition.name}>
                        <TableCell>{condition.name}</TableCell>
                        <TableCell>
                          <Chip label="Active" size="small" color="warning" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {condition.since || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyMessage text="No chronic conditions recorded" />
          )}
        </Paper>
      </Grid>

      {/* Allergies */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <SectionHeader icon={<AllergyIcon color="error" />} title="Allergies" />
          <Divider sx={{ mb: 1 }} />
          {history.allergies.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Allergen</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Reaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.allergies.map((allergy) => (
                    <TableRow key={allergy.allergen}>
                      <TableCell>{allergy.allergen}</TableCell>
                      <TableCell>
                        <Chip
                          label={allergy.severity}
                          size="small"
                          color={severityColor(allergy.severity)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {allergy.reaction}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyMessage text="No allergies recorded" />
          )}
        </Paper>
      </Grid>

      {/* Surgical History */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <SectionHeader icon={<SurgeryIcon color="primary" />} title="Surgical History" />
          <Divider sx={{ mb: 1 }} />
          {history.surgicalHistory.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Procedure</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.surgicalHistory.map((surgery) => (
                    <TableRow key={`${surgery.procedure}-${surgery.date}`}>
                      <TableCell>{surgery.procedure}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {surgery.date ? new Date(surgery.date).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {surgery.notes || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyMessage text="No surgical history recorded" />
          )}
        </Paper>
      </Grid>

      {/* Family History */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <SectionHeader icon={<FamilyIcon color="primary" />} title="Family History" />
          <Divider sx={{ mb: 1 }} />
          {history.familyHistory.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Relation</TableCell>
                    <TableCell>Condition</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.familyHistory.map((entry) => (
                    <TableRow key={`${entry.relation}-${entry.condition}`}>
                      <TableCell>{entry.relation}</TableCell>
                      <TableCell>{entry.condition}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyMessage text="No family history recorded" />
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
