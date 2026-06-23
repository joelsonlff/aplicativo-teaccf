export type CommunicationLevel = 'VERBAL' | 'SEMI_VERBAL' | 'NON_VERBAL'
export type SensoryProfile = 'HYPERSENSITIVE' | 'HYPOSENSITIVE' | 'MIXED'
export type AutismLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
export type AbilityLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type ReinforcementType = 'VISUAL' | 'AUDITORY' | 'COMBINED'
export type Modality = 'visual' | 'auditory' | 'tactile'

export interface CognitiveDomains {
  attentionSpan: AbilityLevel
  workingMemory: AbilityLevel
  processingSpeed: AbilityLevel
  socialCognition: AbilityLevel
}

export interface TeaProfile {
  diagnosisDate?: string
  autismLevel?: AutismLevel
  therapies: string[]
  cognitiveDomains: CognitiveDomains
  behavioralTriggers: string[]
  reinforcementType: ReinforcementType
}

export interface Child {
  id: string
  fullName: string
  birthDate: string
  avatarUrl?: string
  communicationLevel: CommunicationLevel
  sensoryProfile: SensoryProfile
  preferredModalities: Modality[]
  teaProfile: TeaProfile
  notes?: string
  isActive: boolean
  createdBy: string
  schoolId?: string
  createdAt: string
  updatedAt: string
}

export interface ChildLoginResponse {
  child: Pick<Child, 'id' | 'fullName' | 'avatarUrl'>
  accessToken: string
}
