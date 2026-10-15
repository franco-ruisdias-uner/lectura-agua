import type { MotivoNovedad } from '@/types/entities'

export const incidentReasons: { value: MotivoNovedad; label: string }[] = [
  { value: 'perro_suelto', label: 'Perro suelto' },
  { value: 'porton_cerrado', label: 'Portón cerrado' },
  { value: 'pasto_alto', label: 'Pasto o maleza' },
  { value: 'medidor_tapado', label: 'Medidor tapado' },
  { value: 'medidor_roto', label: 'Medidor roto' },
  { value: 'deshabitada', label: 'Vivienda deshabitada' },
  { value: 'no_se_encuentra', label: 'No se encuentra el medidor' },
]

export function incidentReasonLabel(motivo: MotivoNovedad): string {
  return incidentReasons.find((reason) => reason.value === motivo)?.label ?? motivo
}
