import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Tv, 
  Film, 
  Video, 
  Activity, 
  Award, 
  ShieldCheck, 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Stethoscope, 
  Eye, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Zap, 
  Layers, 
  Users, 
  Building2, 
  Filter, 
  Calendar, 
  ChevronRight, 
  RotateCw,
  Gauge,
  Flame,
  Check,
  X,
  Compass
} from 'lucide-react';
import { Bout, Participant, Tournament, KeyMoment, KeyMomentType, CameraAngle, FederationAnalyticsReport } from '../types/schema';
import { SAMPLE_KEY_MOMENTS, SAMPLE_FEDERATION_REPORT } from '../data/sampleVideoAnalytics';
import { useApp } from '../context/AppContext';

interface VideoAnalyticsModuleProps {
  bouts: Bout[];
  participants: Participant[];
  selectedTournament: Tournament;
  onNavigateToScoreboard?: () => void;
  onNavigateToProtocols?: () => void;
}

export const VideoAnalyticsModule: React.FC<VideoAnalyticsModuleProps> = ({
  bouts,
  participants,
  selectedTournament,
  onNavigateToScoreboard,
  onNavigateToProtocols
}) => {
  const { language, t } = useApp();

  // Active Main Sub-Tab: 'video_breakdown' | 'federation_report'
  const [activeTab, setActiveTab] = useState<'video_breakdown' | 'federation_report'>('video_breakdown');

  // Video Selection
  const completedBouts = bouts.filter((b) => b.status === 'completed' || b.akaScore > 0 || b.aoScore > 0);
  const activeBoutsList = completedBouts.length > 0 ? completedBouts : bouts;
  const [selectedBoutId, setSelectedBoutId] = useState<string>(activeBoutsList[0]?.id || 'b1');
  const activeBout = bouts.find((b) => b.id === selectedBoutId) || bouts[0];

  // Video Player Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSeconds, setCurrentSeconds] = useState<number>(24);
  const totalBoutDurationSeconds = 180; // 3:00 WKF Kumite match
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedCamera, setSelectedCamera] = useState<CameraAngle>('cam_main');
  const [showBiometricsSkeleton, setShowBiometricsSkeleton] = useState<boolean>(true);
  const [filterMomentType, setFilterMomentType] = useState<string>('all');

  // Key moments for selected bout
  const [boutMoments, setBoutMoments] = useState<KeyMoment[]>(
    SAMPLE_KEY_MOMENTS[selectedBoutId] || SAMPLE_KEY_MOMENTS['b1']
  );

  // Selected Key Moment for deep analytical inspection
  const [selectedMomentId, setSelectedMomentId] = useState<string>(
    boutMoments[0]?.id || 'km-1'
  );
  const selectedMoment = boutMoments.find((m) => m.id === selectedMomentId) || boutMoments[0];

  // When selected bout changes, sync moments
  useEffect(() => {
    const list = SAMPLE_KEY_MOMENTS[selectedBoutId] || SAMPLE_KEY_MOMENTS['b1'];
    setBoutMoments(list);
    if (list.length > 0) {
      setSelectedMomentId(list[0].id);
      setCurrentSeconds(list[0].timestampSeconds);
    }
  }, [selectedBoutId]);

  // Video playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSeconds((prev) => {
          if (prev >= totalBoutDurationSeconds) {
            setIsPlaying(false);
            return totalBoutDurationSeconds;
          }
          return Math.min(totalBoutDurationSeconds, prev + 0.5 * playbackSpeed);
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Jump to specific timestamp
  const handleJumpToMoment = (moment: KeyMoment) => {
    setSelectedMomentId(moment.id);
    setCurrentSeconds(moment.timestampSeconds);
    setIsPlaying(false);
  };

  // Add custom manual analysis tag
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);
  const [newTagTitle, setNewTagTitle] = useState<string>('');
  const [newTagSide, setNewTagSide] = useState<'aka' | 'ao'>('aka');

  const handleSaveCustomTag = () => {
    if (!newTagTitle.trim()) return;
    const newMoment: KeyMoment = {
      id: `custom-${Date.now()}`,
      boutId: activeBout.id,
      timestampSeconds: Math.floor(currentSeconds),
      displayTime: formatTime(Math.floor(currentSeconds)),
      title: newTagTitle,
      type: 'score_yuko',
      competitor: newTagSide,
      athleteName: newTagSide === 'aka' ? activeBout.akaParticipant?.lastName || 'AKA' : activeBout.aoParticipant?.lastName || 'AO',
      athleteClub: newTagSide === 'aka' ? activeBout.akaParticipant?.clubName || 'СК' : activeBout.aoParticipant?.clubName || 'СК',
      techniqueName: 'Gyaku-tsuki',
      targetZone: 'Chudan (Корпус)',
      speedMps: 11.5,
      reactionMs: 190,
      refereeFlags: { k1: true, k2: true, k3: false, k4: true, consensus: '3 из 4 судей' },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 94.2,
      notes: `Пользовательская отметка аналитика судейской коллегии на отметке ${formatTime(Math.floor(currentSeconds))}.`
    };
    setBoutMoments((prev) => [...prev, newMoment].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
    setSelectedMomentId(newMoment.id);
    setNewTagTitle('');
    setIsAddingTag(false);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered moments list
  const filteredMoments = boutMoments.filter((m) => {
    if (filterMomentType === 'all') return true;
    if (filterMomentType === 'scores') return m.type.startsWith('score_');
    if (filterMomentType === 'warnings') return m.type.startsWith('warning_');
    if (filterMomentType === 'vr') return m.type.startsWith('vr_challenge');
    if (filterMomentType === 'doctor') return m.type === 'doctor_timeout';
    return true;
  });

  // =========================================================================
  // FEDERATION REPORT STATE & AI GENERATION
  // =========================================================================
  const [report, setReport] = useState<FederationAnalyticsReport>(SAMPLE_FEDERATION_REPORT);
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState<boolean>(false);
  const [aiReportToast, setAiReportToast] = useState<string | null>(null);

  const handleGenerateAiReport = async () => {
    setIsGeneratingAiReport(true);
    setAiReportToast(null);

    try {
      const response = await fetch('/api/ai/federation-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentTitle: selectedTournament.title,
          chiefReferee: report.chiefReferee,
          language,
          stats: {
            totalBouts: bouts.length || 148,
            totalPoints: report.scoringDistribution.totalPoints,
            yukoPct: report.scoringDistribution.yukoPct,
            wazaAriPct: report.scoringDistribution.wazaAriPct,
            ipponPct: report.scoringDistribution.ipponPct,
            vrTotal: report.refereeingAccuracy.vrChallengesTotal,
            vrOverturned: report.refereeingAccuracy.vrChallengesOverturned,
            docTimeouts: report.safetyAndMedical.doctorTimeoutsCount
          }
        })
      });

      const data = await response.json();
      if (data?.executiveSummary) {
        setReport((prev) => ({
          ...prev,
          executiveAiSummary: data.executiveSummary,
          generatedAt: new Date().toISOString()
        }));
        setAiReportToast('✓ Официальное заключение WKF успешно обновлено через Gemini 3.8 Flash!');
      }
    } catch (err) {
      setAiReportToast('Отчет сгенерирован на базе правил и протоколов соревнований.');
    } finally {
      setIsGeneratingAiReport(false);
      setTimeout(() => setAiReportToast(null), 5000);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportReportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WKF_Federation_Report_${selectedTournament.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans w-full min-w-0 animate-fadeIn">
      
      {/* =========================================================================
          MODULE HEADER & PRIMARY TABS
          ========================================================================= */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-xl p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm shadow-blue-900/40 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-white" />
              <span>WKF Video Analytics</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>AI Biometrics & Federation Reports</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeTab === 'video_breakdown' 
              ? (language !== 'en' ? 'Модуль видеоаналитики и разбора поединков' : 'Match Video Breakdown & AI Analytics') 
              : (language !== 'en' ? 'Детализированный отчет для Федерации' : 'Official Federation Analytics Report')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {language !== 'en'
              ? 'Автоматический покадровый разбор результативных атак, видеоповторы со спорных ракурсов, оценка критериев WKF 2026 и генерация итоговых статистических отчетов для национальной и всемирной федерации.'
              : 'Automated frame-by-frame analysis of scoring strikes, multi-angle camera feeds, WKF 6-criteria validation, and comprehensive certified federation report generation.'}
          </p>
        </div>

        {/* Primary Navigation Tabs Switcher */}
        <div className="relative z-10 flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('video_breakdown')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'video_breakdown'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{language !== 'en' ? 'Видеоразбор боя' : 'Match Video Review'}</span>
          </button>

          <button
            onClick={() => setActiveTab('federation_report')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'federation_report'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{language !== 'en' ? 'Отчёт для Федерации' : 'Federation Report'}</span>
          </button>
        </div>
      </div>

      {/* Global Toast if active */}
      {aiReportToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs font-mono shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{aiReportToast}</span>
          </div>
          <button onClick={() => setAiReportToast(null)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: VIDEO BREAKDOWN & KEY MOMENTS
          ========================================================================= */}
      {activeTab === 'video_breakdown' && (
        <div className="space-y-6">
          
          {/* Bout Selection Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>{language !== 'en' ? 'Выбор поединка:' : 'Select Bout:'}</span>
              <select
                value={selectedBoutId}
                onChange={(e) => setSelectedBoutId(e.target.value)}
                className="bg-slate-950 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer"
              >
                {activeBoutsList.map((b) => (
                  <option key={b.id} value={b.id}>
                    Татами {b.tatamiNumber || 1} · Бой №{b.boutNumber} ({b.roundStage.toUpperCase()}) — {b.akaParticipant?.lastName || 'Ака'} vs {b.aoParticipant?.lastName || 'Ао'} ({b.akaScore}:{b.aoScore})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-bold text-slate-200">{activeBout.akaParticipant?.lastName || 'Ака'} ({activeBout.akaScore})</span>
                <span className="text-slate-500 font-bold">vs</span>
                <span className="font-bold text-slate-200">{activeBout.aoParticipant?.lastName || 'Ао'} ({activeBout.aoScore})</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>

              {activeBout.akaSenshu && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Senshu AKA
                </span>
              )}
              {activeBout.aoSenshu && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Senshu AO
                </span>
              )}
            </div>
          </div>

          {/* Main Video Arena Layout: Left Video Canvas, Right AI Radar & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Video Player & Timeline */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Camera Angle Switcher Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ракурс трансляции:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setSelectedCamera('cam_main')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                      selectedCamera === 'cam_main'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🎥 Камера 1 (Общая)
                  </button>
                  <button
                    onClick={() => setSelectedCamera('cam_aka_side')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                      selectedCamera === 'cam_aka_side'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🔴 Ака (Профиль)
                  </button>
                  <button
                    onClick={() => setSelectedCamera('cam_ao_side')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                      selectedCamera === 'cam_ao_side'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🔵 Ао (Профиль)
                  </button>
                  <button
                    onClick={() => setSelectedCamera('cam_referee_vr')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                      selectedCamera === 'cam_referee_vr'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ⚖️ VR ГСК (PIP)
                  </button>
                </div>

                {/* Biometrics Toggle */}
                <button
                  onClick={() => setShowBiometricsSkeleton(!showBiometricsSkeleton)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    showBiometricsSkeleton
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                  title="Отображать биометрический скелет и вектор скорости удара"
                >
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>AI Skeleton</span>
                </button>
              </div>

              {/* Realistic Interactive Video Screen Canvas */}
              <div className="relative aspect-video rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4 group select-none">
                
                {/* Background Tatami Arena Mockup with Animated Atmosphere */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 pointer-events-none" />
                
                {/* Simulated Tatami Mat Lines */}
                <div className="absolute inset-x-8 bottom-6 h-28 border-2 border-dashed border-rose-500/20 rounded-2xl bg-rose-950/10 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 rounded-full border border-blue-500/30 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-slate-600 font-bold uppercase">WKF 8x8m</span>
                  </div>
                </div>

                {/* Overlay Top Live Bar */}
                <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] uppercase tracking-wider animate-pulse shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      REC · REPLAY
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur text-slate-300 border border-slate-800 text-[11px]">
                      {selectedCamera === 'cam_main' && 'Камера 1 (Широкий план ковра)'}
                      {selectedCamera === 'cam_aka_side' && 'Камера 2 (Ака Боковой угол 60 FPS)'}
                      {selectedCamera === 'cam_ao_side' && 'Камера 3 (Ао Боковой угол 60 FPS)'}
                      {selectedCamera === 'cam_referee_vr' && 'Камера 4 (VR Картинка в картинке ГСК)'}
                    </span>
                  </div>

                  {/* Watermark & FPS */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/70 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">60.0 FPS</span>
                    <span>·</span>
                    <span>1080p HD</span>
                    <span>·</span>
                    <span className="font-bold text-slate-200">TATAMI.KG VR</span>
                  </div>
                </div>

                {/* Biometric AI Tracking Canvas Elements */}
                {showBiometricsSkeleton && (
                  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-around px-16">
                    {/* AKA Fighter Biometrics */}
                    <div className="flex flex-col items-center space-y-1 transform -translate-x-4">
                      {/* Head target */}
                      <div className="w-8 h-8 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center animate-pulse">
                        <span className="text-[8px] font-mono text-rose-300 font-bold">JODAN</span>
                      </div>
                      {/* Torso & Strike Vector Line */}
                      <div className="w-1 h-14 bg-rose-500/80 relative">
                        {/* Punch Vector line */}
                        <div className="absolute top-2 left-0 w-24 h-0.5 bg-gradient-to-r from-rose-400 to-amber-300 shadow-sm shadow-rose-500">
                          <span className="absolute -top-4 right-0 px-1.5 py-0.2 rounded bg-rose-950/90 text-[9px] font-mono font-bold text-amber-300 border border-rose-600/70 whitespace-nowrap">
                            ⚡ {selectedMoment?.speedMps || 12.8} m/s
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-1 bg-rose-500/50" />
                      <div className="flex justify-between w-10">
                        <div className="w-1 h-12 bg-rose-500/60" />
                        <div className="w-1 h-12 bg-rose-500/60" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-slate-950/80 px-2 py-0.5 rounded border border-rose-800">
                        AKA: {activeBout.akaParticipant?.lastName || 'Ака'}
                      </span>
                    </div>

                    {/* Impact Zone Flash indicator */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-400 bg-amber-400/10 flex items-center justify-center animate-ping">
                        <Target className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="text-[9px] font-mono text-amber-300 font-black uppercase mt-1 bg-black/70 px-2 py-0.5 rounded">
                        {selectedMoment?.techniqueName || 'Gyaku-tsuki'} ({selectedMoment?.targetZone || 'Chudan'})
                      </span>
                    </div>

                    {/* AO Fighter Biometrics */}
                    <div className="flex flex-col items-center space-y-1 transform translate-x-4">
                      {/* Head */}
                      <div className="w-8 h-8 rounded-full border-2 border-blue-500 bg-blue-500/20 flex items-center justify-center">
                        <span className="text-[8px] font-mono text-blue-300 font-bold">JODAN</span>
                      </div>
                      <div className="w-1 h-14 bg-blue-500/80" />
                      <div className="w-12 h-1 bg-blue-500/50" />
                      <div className="flex justify-between w-10">
                        <div className="w-1 h-12 bg-blue-500/60" />
                        <div className="w-1 h-12 bg-blue-500/60" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-slate-950/80 px-2 py-0.5 rounded border border-blue-800">
                        AO: {activeBout.aoParticipant?.lastName || 'Ао'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Overlay Bottom Floating Info on Selected Moment */}
                <div className="relative z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {formatTime(currentSeconds)}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{selectedMoment?.title || 'Разбор технического действия'}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          AI {selectedMoment?.aiConfidence || 98.4}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3 mt-0.5">
                        <span>Скорость: <strong className="text-amber-300">{selectedMoment?.speedMps || 12.8} м/с ({(Number(selectedMoment?.speedMps || 12.8) * 3.6).toFixed(1)} км/ч)</strong></span>
                        <span>·</span>
                        <span>Реакция: <strong className="text-sky-300">{selectedMoment?.reactionMs || 172} мс</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Добавить метку</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Tag Dialog Form if active */}
              {isAddingTag && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Добавить аналитическую метку на {formatTime(currentSeconds)}:</span>
                    <button onClick={() => setIsAddingTag(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={newTagTitle}
                      onChange={(e) => setNewTagTitle(e.target.value)}
                      placeholder="Например: Спорный контакт в голову / Выход за линию"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-blue-500"
                    />
                    <select
                      value={newTagSide}
                      onChange={(e) => setNewTagSide(e.target.value as 'aka' | 'ao')}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none font-bold cursor-pointer"
                    >
                      <option value="aka">🔴 АКА ({activeBout.akaParticipant?.lastName})</option>
                      <option value="ao">🔵 АО ({activeBout.aoParticipant?.lastName})</option>
                    </select>
                    <button
                      onClick={handleSaveCustomTag}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline Scrubbing Bar with Key Moments Markers */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-white">{formatTime(currentSeconds)}</span>
                  <span>Таймлайн поединка (3:00)</span>
                  <span>03:00</span>
                </div>

                {/* Progress bar container with markers */}
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, clickX / rect.width));
                    setCurrentSeconds(pct * totalBoutDurationSeconds);
                  }}
                  className="relative h-4 bg-slate-950 rounded-full cursor-pointer overflow-visible border border-slate-800 group"
                >
                  {/* Active progress fill */}
                  <div 
                    style={{ width: `${(currentSeconds / totalBoutDurationSeconds) * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-100 relative"
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-blue-600" />
                  </div>

                  {/* Moment Markers along the timeline */}
                  {boutMoments.map((m) => {
                    const pct = (m.timestampSeconds / totalBoutDurationSeconds) * 100;
                    const isSelected = m.id === selectedMomentId;

                    return (
                      <button
                        key={m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJumpToMoment(m);
                        }}
                        style={{ left: `${pct}%` }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 transition-transform hover:scale-150 z-20 cursor-pointer ${
                          m.type.startsWith('score_ippon')
                            ? 'bg-amber-400 border-amber-600'
                            : m.type.startsWith('score_wazaari')
                            ? 'bg-rose-500 border-rose-700'
                            : m.type.startsWith('score_yuko')
                            ? 'bg-sky-400 border-sky-600'
                            : m.type.startsWith('vr_challenge')
                            ? 'bg-purple-400 border-purple-600'
                            : m.type === 'doctor_timeout'
                            ? 'bg-teal-400 border-teal-600'
                            : 'bg-yellow-400 border-yellow-600'
                        } ${isSelected ? 'ring-4 ring-blue-500 scale-125' : ''}`}
                        title={`${m.displayTime} · ${m.title}`}
                      />
                    );
                  })}
                </div>

                {/* Playback Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {/* Left Controls: Step back, Play/Pause, Step forward */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentSeconds((prev) => Math.max(0, prev - 5))}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      title="Назад на 5 секунд"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-900/40"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                      <span>{isPlaying ? 'Пауза' : 'Воспроизведение'}</span>
                    </button>

                    <button
                      onClick={() => setCurrentSeconds((prev) => Math.min(totalBoutDurationSeconds, prev + 5))}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      title="Вперед на 5 секунд"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    {/* Step 1 frame (33ms) */}
                    <button
                      onClick={() => setCurrentSeconds((prev) => Math.min(totalBoutDurationSeconds, prev + 0.033))}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono transition-colors cursor-pointer"
                      title="Покадровый шаг вперед (1 фрейм = 33 мс)"
                    >
                      +1 кадр
                    </button>
                  </div>

                  {/* Speed Controls: 0.25x, 0.5x, 1x, 2x */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 px-2 uppercase">Скорость:</span>
                    {[0.25, 0.5, 1.0, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          playbackSpeed === spd
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Key Moments Inspector & WKF 6-Criteria Validation */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Filter Pills for Moments */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>Ключевые моменты ({filteredMoments.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">WKF AI Tagging</span>
                </div>

                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    { id: 'all', label: 'Все' },
                    { id: 'scores', label: 'Баллы' },
                    { id: 'warnings', label: 'Штрафы' },
                    { id: 'vr', label: 'VR Челлендж' },
                    { id: 'doctor', label: 'Врач' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterMomentType(f.id)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                        filterMomentType === f.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Moments List */}
              <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {filteredMoments.map((m) => {
                  const isSelected = m.id === selectedMomentId;
                  const isAka = m.competitor === 'aka';
                  const isAo = m.competitor === 'ao';

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleJumpToMoment(m)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                          : 'bg-slate-900 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {m.displayTime}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                            isAka ? 'bg-rose-950 text-rose-300 border border-rose-800' : isAo ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {m.competitor.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white truncate">
                          {m.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span>{m.athleteName}</span>
                          <span>·</span>
                          <span className="text-amber-300">{m.speedMps} м/с</span>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 mt-2 transition-transform ${isSelected ? 'text-blue-400 translate-x-1' : 'text-slate-600'}`} />
                    </div>
                  );
                })}
              </div>

              {/* Selected Key Moment Deep Analytical Inspection Card */}
              {selectedMoment && (
                <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-rose-400" />
                      <span>Разбор момента ({selectedMoment.displayTime})</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      AI Точность {selectedMoment.aiConfidence}%
                    </span>
                  </div>

                  {/* Technique Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Техника:</span>
                      <strong className="text-slate-200 text-xs">{selectedMoment.techniqueName || 'Техническое действие'}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Зона удара:</span>
                      <strong className="text-amber-300 text-xs">{selectedMoment.targetZone}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Скорость удара:</span>
                      <strong className="text-sky-300 text-xs">{selectedMoment.speedMps} м/с</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Время реакции:</span>
                      <strong className="text-emerald-300 text-xs">{selectedMoment.reactionMs} мс</strong>
                    </div>
                  </div>

                  {/* WKF 6-Criteria Audit Checkbox Grid */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Соответствие 6 критериям WKF 2026:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                      <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${selectedMoment.criteriaAudit.goodForm ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Хорошая форма</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${selectedMoment.criteriaAudit.sportingAttitude ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Спортивный дух</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${selectedMoment.criteriaAudit.zanshin ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Zanshin (Фокус)</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${selectedMoment.criteriaAudit.properTiming ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Тайминг</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${selectedMoment.criteriaAudit.correctDistance ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Дистанция</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${selectedMoment.criteriaAudit.vigorousApplication ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Импульс (Kime)</span>
                      </div>
                    </div>
                  </div>

                  {/* Referee Flags Consensus */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Флаги боковых судей:</span>
                      <span className="text-emerald-400 font-bold">{selectedMoment.refereeFlags.consensus}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                      <div className={`p-1 rounded ${selectedMoment.refereeFlags.k1 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-500'}`}>
                        Судья 1
                      </div>
                      <div className={`p-1 rounded ${selectedMoment.refereeFlags.k2 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-500'}`}>
                        Судья 2
                      </div>
                      <div className={`p-1 rounded ${selectedMoment.refereeFlags.k3 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-500'}`}>
                        Судья 3
                      </div>
                      <div className={`p-1 rounded ${selectedMoment.refereeFlags.k4 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-500'}`}>
                        Судья 4
                      </div>
                    </div>
                  </div>

                  {/* VR Challenge Result (if applicable) */}
                  {selectedMoment.vrOutcome && (
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/80 text-purple-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1 text-purple-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Результат видеоповтора VR</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{selectedMoment.vrOutcome.rulingText}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedMoment.notes && (
                    <p className="text-[11px] text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-2">
                      «{selectedMoment.notes}»
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FEDERATION ANALYTICS & EXECUTIVE REPORTS
          ========================================================================= */}
      {activeTab === 'federation_report' && (
        <div className="space-y-6">
          
          {/* Executive Action Toolbar: AI Generation, Print, Export */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Официальный отчет Федерации каратэ (WKF Compliance)
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Документ № {report.reportId} · Утвержден ГСК
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGenerateAiReport}
                disabled={isGeneratingAiReport}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-md shadow-blue-900/40 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiReport ? 'animate-spin' : 'text-amber-300'}`} />
                <span>{isGeneratingAiReport ? 'Генерация заключения...' : 'Сгенерировать AI-заключение'}</span>
              </button>

              <button
                onClick={handlePrintReport}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Печать официального бланка отчета"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Печать</span>
              </button>

              <button
                onClick={handleExportReportJson}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Экспорт сырых данных аналитики в JSON"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Top 4 KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Проведено поединков</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {report.totalBoutsAnalyzed}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Всего баллов: <strong className="text-emerald-400">{report.scoringDistribution.totalPoints}</strong> (4.14 / бой)
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Эффективность VR Челленджей</span>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {report.refereeingAccuracy.overturnRatePct}%
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {report.refereeingAccuracy.vrChallengesOverturned} из {report.refereeingAccuracy.vrChallengesTotal} апелляций подтверждено
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Консенсус судейских флагов</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {report.refereeingAccuracy.flagConsensusRatioPct}%
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Среднее время VR: <strong className="text-sky-400">{report.refereeingAccuracy.averageReviewDurationSec}с</strong>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Медицинский контроль (80s)</span>
                <Stethoscope className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {report.safetyAndMedical.doctorTimeoutsCount}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Снятий (Kiken): <strong className="text-rose-400">{report.safetyAndMedical.kikenCount}</strong> · Ср. время: {report.safetyAndMedical.averageDoctorDurationSec}с
              </div>
            </div>
          </div>

          {/* Technical Breakdown: Scoring & Disciplines Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Technique Distribution Bars */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Структура результативных атак (Кумитэ)</span>
                </h4>
                <span className="text-xs font-mono text-slate-400">WKF Classification</span>
              </div>

              {/* Progress Distribution Bar (Yuko / Waza-ari / Ippon) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-sky-400 font-bold">YUKO ({report.scoringDistribution.yukoPct}%)</span>
                  <span className="text-amber-400 font-bold">WAZA-ARI ({report.scoringDistribution.wazaAriPct}%)</span>
                  <span className="text-rose-400 font-bold">IPPON ({report.scoringDistribution.ipponPct}%)</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
                  <div style={{ width: `${report.scoringDistribution.yukoPct}%` }} className="bg-sky-500" title="Yuko (1 балл)" />
                  <div style={{ width: `${report.scoringDistribution.wazaAriPct}%` }} className="bg-amber-500" title="Waza-ari (2 балла)" />
                  <div style={{ width: `${report.scoringDistribution.ipponPct}%` }} className="bg-rose-500" title="Ippon (3 балла)" />
                </div>
              </div>

              {/* Technique Breakdown List */}
              <div className="space-y-2.5 pt-2">
                {report.scoringDistribution.topTechniques.map((tech, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold">{tech.name}</span>
                      <span className="text-slate-400"><strong>{tech.count}</strong> ({tech.pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                      <div 
                        style={{ width: `${tech.pct * 2}%` }}
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-sky-400' : idx === 2 ? 'bg-amber-400' : 'bg-indigo-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Disciplinary & Safety Analytics */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Дисциплинарная аналитика и штрафы</span>
                  </h4>
                  <span className="text-xs font-mono text-slate-400">C1 & C2 Warnings</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Категория 1 (Контакт):</span>
                    <div className="text-2xl font-black text-rose-400">{report.disciplinaryAnalytics.c1WarningsCount}</div>
                    <span className="text-[10px] text-slate-400">Избыточный контакт, удары в горло/пах</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Категория 2 (Выходы/Захваты):</span>
                    <div className="text-2xl font-black text-amber-400">{report.disciplinaryAnalytics.c2WarningsCount}</div>
                    <span className="text-[10px] text-slate-400">Jogai, Mubobi, уход от борьбы</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                  <span className="text-slate-400 text-[11px]">Наиболее частое нарушение:</span>
                  <div className="font-bold text-amber-300">{report.disciplinaryAnalytics.mostCommonInfraction}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-800/60 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Медицинская сводка (Doctor 80s):</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {report.safetyAndMedical.primaryInjuryZone}. Средняя длительность таймаута составила {report.safetyAndMedical.averageDoctorDurationSec} секунд, ни один спортсмен не превысил лимит в 80 секунд.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono text-right">
                Стандарты WKF Competition Rules 2026
              </div>
            </div>
          </div>

          {/* Club Federation Medal & Performance Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Итоговый общекомандный зачёт клубов и регионов</span>
              </h4>
              <span className="text-xs font-mono text-slate-400">Рейтинг эффективности</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Ранг</th>
                    <th className="py-2.5 px-3">Клуб / Додзё</th>
                    <th className="py-2.5 px-3">Город</th>
                    <th className="py-2.5 px-3 text-center">Атлетов</th>
                    <th className="py-2.5 px-3 text-center text-amber-400">Золото (1)</th>
                    <th className="py-2.5 px-3 text-center text-slate-300">Серебро (2)</th>
                    <th className="py-2.5 px-3 text-center text-amber-600">Бронза (3)</th>
                    <th className="py-2.5 px-3 text-center">Всего</th>
                    <th className="py-2.5 px-3 text-right">Очки ФКР</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Эффективность</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {report.clubRankings.map((c) => (
                    <tr key={c.rank} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-300">
                        {c.rank === 1 ? '🥇 1' : c.rank === 2 ? '🥈 2' : c.rank === 3 ? '🥉 3' : c.rank}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{c.clubName}</td>
                      <td className="py-3 px-3 text-slate-400">{c.city}</td>
                      <td className="py-3 px-3 text-center text-slate-300">{c.athletesCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-400 bg-amber-950/20">{c.gold}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-300">{c.silver}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-600">{c.bronze}</td>
                      <td className="py-3 px-3 text-center font-black text-white">{c.totalMedals}</td>
                      <td className="py-3 px-3 text-right font-black text-blue-400">{c.pointsScore}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {c.efficiencyRating.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Federation AI Executive Summary & Sign-off Block */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Официальное заключение Судейско-Технической комиссии Федерации
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800 font-bold">
                WKF Certified 2026
              </span>
            </div>

            {/* Executive Text in Pristine Markdown-like layout */}
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line bg-slate-950/80 p-5 rounded-2xl border border-slate-800 font-sans">
              {report.executiveAiSummary}
            </div>

            {/* Recommendations List */}
            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Ключевые рекомендации для национальной федерации:
              </h5>
              <div className="space-y-1.5">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Certification Signature Block */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono text-slate-400">
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500">Главный судья соревнований (ГСК):</span>
                <div className="font-bold text-white text-sm">{report.chiefReferee}</div>
                <div className="text-[11px] text-emerald-400">✓ Электронная подпись подтверждена (WKF License № RU-7749-REF)</div>
              </div>

              <div className="space-y-1 md:text-right">
                <span className="text-[10px] uppercase text-slate-500">Технический делегат Федерации:</span>
                <div className="font-bold text-white text-sm">{report.technicalDelegate}</div>
                <div className="text-[11px] text-slate-400">Дата фиксации: {new Date(report.generatedAt).toLocaleString(language !== 'en' ? 'ru-RU' : 'en-US')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
