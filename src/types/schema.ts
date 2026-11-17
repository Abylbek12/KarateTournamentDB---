export type UserRole = 
  | 'admin'
  | 'chief_referee'
  | 'tatami_referee'
  | 'scorekeeper'
  | 'club_coach'
  | 'athlete'
  | 'medical_officer';

export type RefereeCategory = 
  | 'international_a'
  | 'international_b'
  | 'national_1'
  | 'national_2'
  | 'regional';

export type TournamentRules = 'wkf' | 'skif' | 'kyokushin' | 'olympic' | 'jka';

export type TournamentStatus = 
  | 'draft'
  | 'registration_open'
  | 'draw_completed'
  | 'in_progress'
  | 'completed';

export type Gender = 'male' | 'female' | 'mixed';

export type BeltRank = 
  | 'white_10kyu'
  | 'yellow_8kyu'
  | 'orange_7kyu'
  | 'green_6kyu'
  | 'blue_4kyu'
  | 'brown_3kyu'
  | 'brown_1kyu'
  | 'black_1dan'
  | 'black_2dan'
  | 'black_3dan_plus'
  | 'other'; // свой вариант: текст в Participant.beltOther

export type ParticipantStatus = 
  | 'registered'
  | 'weighed_in'
  | 'draw_seeded'
  | 'competing'
  | 'disqualified'
  | 'withdrawn';

/** 'other' = the organizer's own discipline, named in EventCategory.customDiscipline. */
export type Discipline = 'kumite' | 'kata' | 'team_kumite' | 'team_kata' | 'other';

export type BracketType = 
  | 'olympic_with_repechage'
  | 'olympic_direct_elimination'
  | 'round_robin';

export type TatamiStatus = 'ready' | 'active' | 'paused' | 'finished';

export type RoundStage = 
  | 'round_1_32'
  | 'round_1_16'
  | 'round_1_8'
  | 'quarter_final'
  | 'semi_final'
  | 'repechage'
  | 'bronze_match'
  | 'final';

export type BoutStatus = 
  | 'scheduled'
  | 'waiting_competitors'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type WinReason = 
  | 'points_lead'
  | 'senshu_advantage'
  | 'hantei_decision'
  | 'ippon_kyokushin'
  | 'hansoku_dq'
  | 'kiken_injury'
  | 'ippon_direct'
  | 'awasete_ippon'
  | 'shobu_sanbon_win'
  | 'mercy_rule_8pt'
  | 'encho_sen_sudden_death';

export type CompetitorColor = 'aka' | 'ao';

export interface ColumnDef {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string; // e.g. "users.id"
  nullable: boolean;
  defaultValue?: string;
  description: string;
}

export interface IndexDef {
  name: string;
  columns: string[];
  isUnique?: boolean;
  description: string;
}

export interface TableDef {
  id: string;
  name: string;
  category: 'auth_org' | 'athletes_categories' | 'tatami_matches';
  russianName: string;
  description: string;
  columns: ColumnDef[];
  indexes: IndexDef[];
  constraints: string[];
}

// Runtime models for tournament application
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  licenseCode?: string;
  refereeCategory?: RefereeCategory;
  clubId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TournamentScheduleItem {
  time: string;
  title: string;
  stage: string;
  tatamiNumber?: number;
}

export interface Tournament {
  id: string;
  title: string;
  slug: string;
  rulesType: TournamentRules;
  organization: string;
  venueName: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  chiefRefereeId?: string;
  athleteCount?: number;
  clubCount?: number;
  disciplines?: string[];
  tatamiCount?: number;
  /** Rules in the organizer's own words (shown to participants). */
  rulesLabel?: string;
  registrationDeadline?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  isRegistrationOpen?: boolean;
  sportType?: string;
  league?: string;
  scheduleSummary?: TournamentScheduleItem[];
  /** YouTube live broadcast per tatami: { "1": "https://www.youtube.com/watch?v=..." }. */
  liveStreams?: Record<string, string>;
}

export interface Club {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  region: string;
  headCoachName: string;
  contactPhone: string;
  contactEmail?: string;
  federationCode?: string;
  athleteCount?: number;
}

export interface TournamentClub {
  id: string;
  tournamentId: string;
  clubId: string;
  clubName?: string;
  teamLeaderName: string;
  athletesDeclaredCount: number;
  athletesAdmittedCount: number;
  status: 'pending' | 'accredited' | 'verified' | 'rejected';
  feePaid?: boolean;
  registeredAt: string;
}

export interface AgeCategory {
  id: string;
  name: string;
  code: string;
  minAge: number;
  maxAge: number | null;
  matchDurationSeconds: number;
}

export interface WeightCategory {
  id: string;
  ageCategoryId: string;
  gender: Gender;
  name: string;
  minWeightKg: number;
  maxWeightKg: number | null;
  isOpenWeight: boolean;
}

export interface TournamentCategory {
  id: string;
  name?: string;
  tournamentId: string;
  ageCategoryId: string;
  weightCategoryId?: string;
  discipline: Discipline;
  gender: Gender;
  bracketType: BracketType;
  assignedTatamiId?: string;
  ageCategoryName?: string;
  weightCategoryName?: string;
  participantsCount?: number;
}

export interface CategoryEntry {
  id: string;
  categoryId: string;
  participantId: string;
  seedNumber?: number;
  finalPlacement?: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  tournamentId: string;
  clubId: string;
  clubName?: string;
  city: string; // Обязательное поле: город атлета/клуба
  country: string; // Обязательное поле: страна атлета (WKF / ФКР)
  categoryId?: string; // Target tournament category
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  beltRank: BeltRank;
  beltOther?: string; // что вписал спортсмен, если выбрал пояс «Другое»
  declaredWeightKg: number;
  actualWeightKg: number | null;
  isWeighedIn: boolean;
  isMedicalCleared: boolean;
  feePaymentStatus?: 'paid' | 'pending' | 'exempt' | 'refunded';
  feeAmountRub?: number;
  status: ParticipantStatus;
  licenseNumber: string;
  placement?: '1st_gold' | '2nd_silver' | '3rd_bronze_1' | '3rd_bronze_2' | '5th' | '7th';
  /** NOC (IOC) country code, e.g. KGZ — used for flags and international results. */
  countryCode?: string;
  /** Name in Latin letters for international protocols (auto-transliterated if empty). */
  lastNameLatin?: string;
  firstNameLatin?: string;
  /** Account that submitted the entry (athlete, parent or coach). */
  createdBy?: string;
  createdAt?: string;
  /** Team entries (team kata / team kumite): team name and members. */
  teamName?: string;
  teamMembers?: string[];
  /** Set at weigh-in when the athlete does not fit the category. */
  eligibilityNote?: string;
}

/**
 * A category of one tournament, created by the organizer (stored on the server).
 * Age is counted on the first day of the tournament.
 */
export interface EventCategory {
  id: string;
  tournamentId: string;
  discipline: Discipline;
  gender: Gender;
  ageMin: number;
  ageMax: number | null;
  /** Kumite only; null = open weight. Upper bound is inclusive ("-60 kg" = up to 60.0). */
  weightMin: number | null;
  weightMax: number | null;
  /** Lowest belt allowed (optional). */
  minBelt?: BeltRank;
  /** Entry fee in the tournament currency. */
  fee: number;
  durationSeconds: number;
  /** Optional custom name; otherwise generated. */
  name?: string;
  /** Name of the discipline when discipline is 'other' (e.g. «Кихон», «Тамешивари»). */
  customDiscipline?: string;
  isClosed?: boolean;
}

export interface Tatami {
  id: string;
  tournamentId: string;
  number: number;
  name: string;
  locationZone: string;
  chiefJudgeId?: string;
  scorekeeperId?: string;
  status: TatamiStatus;
  currentBoutId?: string;
}

export interface BoutEvent {
  id: string;
  boutId: string;
  matchSecond: number;
  competitorColor: CompetitorColor;
  participantId: string;
  eventType: 'yuko_1' | 'waza_ari_2' | 'ippon_3' | 'senshu' | 'c1_warning' | 'c2_warning' | 'hansoku';
  points: number;
  timestamp: string;
}

export interface Bout {
  id: string;
  tournamentId: string;
  categoryId: string;
  categoryName?: string;
  tatamiId: string;
  tatamiNumber?: number;
  boutNumber: number;
  roundStage: RoundStage;
  bracketPosition: number;
  akaParticipantId?: string;
  akaParticipant?: Participant;
  aoParticipantId?: string;
  aoParticipant?: Participant;
  scheduledTime: string;
  /** Full bout length in seconds (depends on the age category). */
  durationSeconds?: number;
  /** Epoch ms when the clock was last started; null/undefined while stopped. */
  timerStartedAt?: number | null;
  /** Set when time is up with a tie and no Senshu: judges must decide (Hantei). */
  awaitingDecision?: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  akaScore: number;
  aoScore: number;
  akaSenshu: boolean;
  aoSenshu: boolean;
  akaPenaltiesC1: number;
  aoPenaltiesC1: number;
  akaPenaltiesC2: number;
  aoPenaltiesC2: number;
  // SKIF specific scoring & penalties
  ruleSystem?: TournamentRules;
  skifFormat?: 'shobu_ippon' | 'shobu_sanbon';
  akaWazaAri?: number;
  aoWazaAri?: number;
  akaIppon?: number;
  aoIppon?: number;
  akaSkifPenalties?: number; // 0: None, 1: Keikoku, 2: Chui, 3: Hansoku-Chui, 4: Hansoku
  aoSkifPenalties?: number;
  akaJogai?: number; // 0..4
  aoJogai?: number;
  isEnchoSen?: boolean;
  // Manual override audit logs
  overrideNotes?: Array<{ timestamp: string; note: string; operator: string }>;
  // Discipline & Kata specific fields
  discipline?: Discipline;
  kataNameAka?: string;
  kataNameAo?: string;
  akaKataScore?: number;
  aoKataScore?: number;
  refereeProtocolId?: string;
  winnerId?: string;
  winReason?: WinReason;
  status: BoutStatus;
  timerSecondsRemaining: number;
  events?: BoutEvent[];
  // VR Video Review & Coach Challenges
  akaChallengeAvailable?: boolean;
  aoChallengeAvailable?: boolean;
  vrReviewActive?: boolean;
  vrReviewSide?: 'aka' | 'ao';
  vrReviewReason?: string;
}

export interface RefereeProtocol {
  id: string;
  protocolNumber: string;
  boutId: string;
  tournamentId: string;
  tournamentName?: string;
  categoryId: string;
  categoryName?: string;
  discipline: Discipline;
  tatamiNumber: number;
  roundStage: RoundStage;
  akaParticipantId?: string;
  aoParticipantId?: string;
  akaParticipantName: string;
  aoParticipantName: string;
  akaClub: string;
  aoClub: string;
  shushinRefereeName: string;
  kansaArbitratorName: string;
  fukushinReferees: string[];
  scoreSummary: string;
  winnerName: string;
  winReason: string;
  videoReviewUsed: boolean;
  protestFiled: boolean;
  protestStatus?: 'none' | 'filed' | 'upheld' | 'dismissed';
  certifiedAt: string;
  notes?: string;
}

export interface KataEvaluation {
  id: string;
  boutId: string;
  participantId: string;
  participantName: string;
  clubName: string;
  kataName: string;
  judgeScores: number[]; // 5 or 7 judges e.g. [7.6, 7.8, 8.0, 7.7, 7.9]
  trimmedMinScore: number;
  trimmedMaxScore: number;
  technicalScore: number; // 70% WKF weight
  athleticScore: number;  // 30% WKF weight
  totalScore: number;
  rank?: number;
}

export interface TournamentRegistrationConfig {
  isRegistrationOpen: boolean;
  registrationDeadline: string; // ISO datetime e.g. '2026-11-04T18:00'
  shareableToken: string;
  allowPublicSelfRegistration: boolean;
  venueWifiSsid?: string;
  venueLocalServerIp?: string;
  offlineModeActive: boolean;
  notes?: string;
}

export interface LocalLanDevice {
  id: string;
  name: string;
  role: 'tatami_1' | 'tatami_2' | 'tatami_3' | 'tatami_4' | 'chief_referee' | 'scorekeeper' | 'medic' | 'projector';
  ipAddress: string;
  assignedTatamiNumber?: number;
  status: 'connected' | 'syncing' | 'idle' | 'offline';
  lastPing: string;
  activeBoutNumber?: number;
}

// ============================================================================
// Video Analytics & Federation Reports Models
// ============================================================================
export type CameraAngle = 'cam_main' | 'cam_aka_side' | 'cam_ao_side' | 'cam_referee_vr';

export type KeyMomentType = 
  | 'score_yuko'
  | 'score_wazaari'
  | 'score_ippon'
  | 'senshu'
  | 'warning_c1'
  | 'warning_c2'
  | 'vr_challenge_aka'
  | 'vr_challenge_ao'
  | 'doctor_timeout'
  | 'kiken_withdrawal';

export type TechniqueName = 
  | 'Kizami-tsuki'
  | 'Gyaku-tsuki'
  | 'Mawashi-geri'
  | 'Ura-mawashi-geri'
  | 'Ashi-barai + Tsuki'
  | 'Uraken-uchi'
  | 'Ushiro-geri';

export interface SixCriteriaAudit {
  goodForm: boolean;
  sportingAttitude: boolean;
  zanshin: boolean;
  properTiming: boolean;
  correctDistance: boolean;
  vigorousApplication: boolean;
}

export interface KeyMoment {
  id: string;
  boutId: string;
  timestampSeconds: number; // e.g. 48 seconds from match start
  displayTime: string;      // e.g. "01:12"
  title: string;
  type: KeyMomentType;
  competitor: 'aka' | 'ao' | 'both' | 'doctor';
  athleteName: string;
  athleteClub: string;
  techniqueName?: TechniqueName;
  targetZone: 'Jodan (Голова)' | 'Chudan (Корпус)' | 'Ashi (Подсечка)' | 'Tatami Out (Jogai)' | 'Med Zone';
  speedMps: number;         // e.g. 12.4 m/s (44.6 km/h)
  reactionMs: number;       // e.g. 182 ms
  refereeFlags: {
    k1: boolean;
    k2: boolean;
    k3: boolean;
    k4: boolean;
    consensus: string;
  };
  vrOutcome?: {
    requestedBy: 'aka' | 'ao';
    technique: string;
    confirmed: boolean;
    rulingText: string;
  };
  criteriaAudit: SixCriteriaAudit;
  aiConfidence: number;      // e.g. 96.8%
  notes?: string;
}

export interface ClubFederationRanking {
  rank: number;
  clubName: string;
  city: string;
  athletesCount: number;
  gold: number;
  silver: number;
  bronze: number;
  totalMedals: number;
  pointsScore: number;
  efficiencyRating: number; // points / athlete
}

export interface FederationAnalyticsReport {
  reportId: string;
  tournamentId: string;
  tournamentTitle: string;
  organization: string;
  city: string;
  generatedAt: string;
  chiefReferee: string;
  technicalDelegate: string;
  totalBoutsAnalyzed: number;
  totalAthletes: number;
  totalClubs: number;
  scoringDistribution: {
    totalPoints: number;
    yukoCount: number;
    wazaAriCount: number;
    ipponCount: number;
    yukoPct: number;
    wazaAriPct: number;
    ipponPct: number;
    topTechniques: { name: string; count: number; pct: number }[];
  };
  disciplinaryAnalytics: {
    c1WarningsCount: number;
    c2WarningsCount: number;
    hansokuCount: number;
    shikkakuCount: number;
    mostCommonInfraction: string;
  };
  refereeingAccuracy: {
    vrChallengesTotal: number;
    vrChallengesOverturned: number;
    vrChallengesUpheld: number;
    overturnRatePct: number;
    flagConsensusRatioPct: number;
    averageReviewDurationSec: number;
  };
  safetyAndMedical: {
    doctorTimeoutsCount: number;
    averageDoctorDurationSec: number;
    kikenCount: number;
    primaryInjuryZone: string;
  };
  clubRankings: ClubFederationRanking[];
  executiveAiSummary: string;
  recommendations: string[];
}

// -------------------------------------------------------------
// Live Notification & Operational Dispatcher Models
// -------------------------------------------------------------
export type NotificationCategory = 'tatami' | 'medical' | 'payment' | 'referee' | 'schedule' | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'urgent' | 'critical';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  timestamp: string;
  isRead: boolean;
  tatamiNumber?: number;
  boutId?: string;
  participantId?: string;
  actionTab?: string;
  actionLabel?: string;
  soundAlert?: boolean;
}

// -------------------------------------------------------------
// Tournament Fee Acquiring & Payment Models
// -------------------------------------------------------------
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentMethodType = 'card' | 'sbp_qr' | 'club_invoice' | 'tpay' | 'cash_mandate';
export type FeeCategory = 'athlete_entry' | 'team_entry' | 'coach_license' | 'medical_insurance' | 'late_penalty';

export interface PaymentTransaction {
  id: string;
  orderNumber: string;
  tournamentId: string;
  participantId?: string;
  participantName?: string;
  clubId: string;
  clubName: string;
  amountRub: number;
  feeCategory: FeeCategory;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  fiscalReceiptNumber?: string;
  fiscalSign?: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  categoryName?: string;
  discountVoucher?: string;
  description: string;
}

export interface AcquiringStats {
  totalRevenueRub: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  collectionRatePct: number;
  averageFeeRub: number;
  sbpSharePct: number;
  cardSharePct: number;
  invoiceSharePct: number;
}

// -------------------------------------------------------------
// Official Protocols & Results Export Engine Models
// -------------------------------------------------------------
export type OfficialDocumentType = 
  | 'final_standings'
  | 'medal_standings'
  | 'bout_sheets'
  | 'mandate_weighin'
  | 'referee_board'
  | 'federation_bulletin';

export type ExportDataFormat = 'print_preview' | 'csv' | 'excel' | 'json';

export interface OfficialExportOptions {
  documentType: OfficialDocumentType;
  format: ExportDataFormat;
  categoryId?: string;
  tatamiId?: string;
  includeStampsAndSignatures: boolean;
  includeWkfOfficialHeader: boolean;
  notes?: string;
}

export interface AuthenticatedUserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  provider: 'credentials' | 'google' | 'facebook';
  avatarUrl?: string;
  licenseCode?: string;
  clubName?: string;
  /** Coach who also competes as an athlete. */
  alsoCompetes?: boolean;
  isVerified: boolean;
  confirmedAt?: string;
  lastLoginAt: string;
}


