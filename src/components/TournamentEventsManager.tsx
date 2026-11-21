import React, { useState, useRef } from 'react';
import { disciplineLabel } from '../utils/eventI18n';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Building2, 
  Layers, 
  Check, 
  X, 
  ExternalLink,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Bell,
  Clock,
  Archive,
  RotateCcw,
  ShieldCheck,
  Lock,
  Users,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Tournament, TournamentRules, TournamentStatus, UserRole } from '../types/schema';
import { useApp } from '../context/AppContext';
import { trLang } from '../utils/globalDomTranslator';

export const isTournamentDateExpired = (endDateStr?: string): boolean => {
  if (!endDateStr) return false;
  const cleanDate = endDateStr.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return cleanDate < todayStr;
};

export const isTournamentArchived = (t: Pick<Tournament, 'endDate' | 'status'>): boolean => {
  return isTournamentDateExpired(t.endDate) || t.status === 'completed';
};

export interface TournamentEventsManagerProps {
  tournaments: Tournament[];
  currentUserRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  selectedTournament?: Tournament;
  onSelectTournament?: (tournament: Tournament) => void;
  onAddTournament: (tournament: Tournament) => void;
  onUpdateTournament: (tournament: Tournament) => void;
  onDeleteTournament?: (tournamentId: string) => void;
  onNavigateToDetails?: (tournament: Tournament) => void;
  /** Opens the edit form for this tournament (e.g. «Изменить турнир» on its page). */
  editRequestId?: string | null;
  onEditRequestHandled?: () => void;
  /** Opens an empty creation form (the «Создать турнир» button on the home page). */
  createRequestId?: number | null;
  onCreateRequestHandled?: () => void;
}

export const TournamentEventsManager: React.FC<TournamentEventsManagerProps> = ({
  tournaments,
  currentUserRole = 'admin',
  onRoleChange,
  selectedTournament,
  onSelectTournament,
  onAddTournament,
  onUpdateTournament,
  onDeleteTournament,
  onNavigateToDetails,
  editRequestId,
  onEditRequestHandled,
  createRequestId,
  onCreateRequestHandled
}) => {
  const { language } = useApp();
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const isAdmin = currentUserRole === 'admin';

  // Open the creation form by default for Administrators so they can immediately create an event and upload an image
  // Open by default on big screens; on phones the list comes first (form opens with «+ Создать турнир»)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  // Optional names for the Kyrgyz and English versions of the site
  const [titleKy, setTitleKy] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [organization, setOrganization] = useState('Федерация каратэ (WKF)');
  const [rulesType, setRulesType] = useState<TournamentRules>('wkf');
  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState('Бишкек');
  const [country, setCountry] = useState('Кыргызстан');
  const [startDate, setStartDate] = useState('2026-12-05');
  const [endDate, setEndDate] = useState('2026-12-07');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-11-28 23:59');
  const [status, setStatus] = useState<TournamentStatus>('registration_open');
  // Kept as text while typing, so the field can be cleared and «2» typed (not «12»)
  const [tatamiText, setTatamiText] = useState<string>('4');
  const tatamiCount = Math.min(12, Math.max(1, parseInt(tatamiText, 10) || 1));
  const setTatamiCount = (n: number) => setTatamiText(String(n));
  // Rules in the organizer's own words and custom disciplines
  const [rulesLabel, setRulesLabel] = useState<string>('');
  const [customDiscipline, setCustomDiscipline] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([
    'Кумитэ Индивидуальное (WKF)',
    'Ката Индивидуальное (WKF)',
    'Командное Кумитэ'
  ]);

  // Image Upload State & Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFileInfo, setImageFileInfo] = useState<{ name: string; sizeKb: string; format: string } | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [registryViewTab, setRegistryViewTab] = useState<'active' | 'archive'>('active');
  // The list is closed at first so the admin page stays short; «Все турниры» opens and closes it
  const [showTournamentList, setShowTournamentList] = useState(false);
  const [tournamentPendingDelete, setTournamentPendingDelete] = useState<Tournament | null>(null);

  const tournamentListRef = useRef<HTMLDivElement | null>(null);
  // Show archived tournaments right away: archive tab + open list + scroll to it
  const openArchive = React.useCallback(() => {
    setRegistryViewTab('archive');
    setShowTournamentList(true);
    setTimeout(() => tournamentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, []);

  React.useEffect(() => {
    const handleOpenArchive = () => openArchive();
    window.addEventListener('apsatarov-open-archive-tab', handleOpenArchive);
    return () => window.removeEventListener('apsatarov-open-archive-tab', handleOpenArchive);
  }, [openArchive]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const availableDisciplinesList = [
    'Кумитэ Индивидуальное (WKF)',
    'Ката Индивидуальное (WKF)',
    'Командное Кумитэ',
    'Командное Ката',
    'Сётокан Shobu Ippon',
    'Сётокан Shobu Sanbon',
    'Кёкусинкай весовой нокдаун',
    'Абсолютная весовая категория'
  ];

  const toggleDiscipline = (disc: string) => {
    if (selectedDisciplines.includes(disc)) {
      if (selectedDisciplines.length > 1) {
        setSelectedDisciplines(selectedDisciplines.filter((d) => d !== disc));
      }
    } else {
      setSelectedDisciplines([...selectedDisciplines, disc]);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setTitle('');
    setTitleKy('');
    setTitleEn('');
    setOrganization('Федерация каратэ (WKF)');
    setRulesType('wkf');
    setVenueName('');
    setCity('Бишкек');
    setCountry('Кыргызстан');
    setStartDate('2026-12-05');
    setEndDate('2026-12-07');
    setRegistrationDeadline('2026-11-28 23:59');
    setStatus('registration_open');
    setTatamiCount(4);
    setRulesLabel('');
    setCustomDiscipline('');
    setDescription('');
    setSelectedDisciplines([
      'Кумитэ Индивидуальное (WKF)',
      'Ката Индивидуальное (WKF)',
      'Командное Кумитэ'
    ]);
    setImageUrl('');
    setImageFileInfo(null);
    setImageUploadError(null);
    setIsUploadingImage(false);
    setEditingTournamentId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Explicit click handler for opening the file selector dialog reliably
  const handleTriggerFilePicker = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setImageUploadError(null);
    const inputEl =
      fileInputRef.current ||
      (document.getElementById('tournament-event-image-input') as HTMLInputElement | null);
    if (inputEl) {
      inputEl.value = '';
      inputEl.click();
    }
  };

  // Core validator & uploader for JPG / WebP files up to 2 MB
  const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

  const processSelectedImageFile = (file: File | null | undefined) => {
    setImageUploadError(null);
    if (!file) return;

    const normalizedType = (file.type || '').toLowerCase().trim();
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/webp'];
    const validExtensions = /\.(jpe?g|webp)$/i;
    const hasValidExt = validExtensions.test(file.name);
    const hasValidMime = validMimeTypes.includes(normalizedType);

    if (!hasValidMime && !hasValidExt) {
      const errMsg = tr(
        'Недопустимый формат файла! Разрешены только изображения JPG (.jpg, .jpeg) или WebP (.webp).',
        'Файлдын форматы туура эмес! Болгону JPG (.jpg, .jpeg) же WebP (.webp) сүрөттөрүнө уруксат берилет.',
        'Invalid file format! Only JPG (.jpg, .jpeg) or WebP (.webp) images are allowed.'
      );
      setImageUploadError(errMsg);
      showNotification(errMsg, 'error');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const errMsg = tr(
        `Размер файла (${sizeMb} МБ) превышает допустимый лимит! Максимальный размер — 2 МБ.`,
        `Файлдын көлөмү (${sizeMb} МБ) чектен ашып кетти! Максималдуу көлөм — 2 МБ.`,
        `File size (${sizeMb} MB) exceeds the maximum limit of 2 MB.`
      );
      setImageUploadError(errMsg);
      showNotification(errMsg, 'error');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();

    reader.onload = async (loadEvent) => {
      const rawDataUrl =
        typeof loadEvent.target?.result === 'string'
          ? loadEvent.target.result
          : typeof reader.result === 'string'
          ? reader.result
          : '';
      const isWebp = normalizedType.includes('webp') || /\.webp$/i.test(file.name);
      const effectiveMime = isWebp ? 'image/webp' : 'image/jpeg';
      const formatLabel = isWebp ? 'WebP' : 'JPG';
      const sizeKbLabel = `${Math.max(0.1, file.size / 1024).toFixed(1)} ${language === 'en' ? 'KB' : 'КБ'}`;

      // Ensure dataUrl header matches image/jpeg or image/webp even if browser omitted file.type
      const normalizedDataUrl = rawDataUrl.startsWith('data:image/')
        ? rawDataUrl
        : rawDataUrl.replace(/^data:[^;]*;base64,/, `data:${effectiveMime};base64,`);

      // Immediately update component state as soon as FileReader reads the file
      setImageUrl(normalizedDataUrl);
      setImageFileInfo({ name: file.name, sizeKb: sizeKbLabel, format: formatLabel });

      try {
        const response = await fetch('/api/upload/event-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name || `tournament.${isWebp ? 'webp' : 'jpg'}`,
            mimeType: effectiveMime,
            sizeBytes: file.size,
            dataUrl: normalizedDataUrl
          })
        });

        const result = await response.json();
        if (!response.ok || result.error) {
          setImageUploadError(
            result.error ||
              tr('Ошибка при загрузке изображения', 'Сүрөт жүктөөдө ката кетти', 'Image upload error')
          );
          setIsUploadingImage(false);
          return;
        }

        const savedUrl = result.imageUrl || normalizedDataUrl;
        setImageUrl(savedUrl);
        setImageFileInfo({ name: file.name, sizeKb: sizeKbLabel, format: formatLabel });
        showNotification(
          tr(
            `Изображение «${file.name}» (${formatLabel}, ${sizeKbLabel}) успешно считано и сохранено в БД!`,
            `«${file.name}» (${formatLabel}, ${sizeKbLabel}) сүрөтү ийгиликтүү окулуп, базага сакталды!`,
            `Image "${file.name}" (${formatLabel}, ${sizeKbLabel}) read and saved to database!`
          ),
          'success'
        );
      } catch {
        // Fallback keeps normalizedDataUrl already set in state
        setImageUrl(normalizedDataUrl);
        setImageFileInfo({ name: file.name, sizeKb: sizeKbLabel, format: formatLabel });
      } finally {
        setIsUploadingImage(false);
      }
    };

    reader.onerror = () => {
      setImageUploadError(
        tr('Не удалось прочитать выбранный файл изображения.', 'Тандалган сүрөт файлын окуу мүмкүн болгон жок.', 'Failed to read the selected image file.')
      );
      setIsUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedImageFile(file);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processSelectedImageFile(file);
  };

  // Pre-fill form for editing
  const handleStartEdit = (t: Tournament) => {
    setEditingTournamentId(t.id);
    setTitle(t.title);
    setTitleKy(t.titleKy || '');
    setTitleEn(t.titleEn || '');
    setOrganization(t.organization || 'Федерация каратэ');
    setRulesType(t.rulesType);
    setVenueName(t.venueName);
    setCity(t.city);
    setCountry(t.country);
    setStartDate(t.startDate);
    setEndDate(t.endDate);
    setRegistrationDeadline(t.registrationDeadline || '');
    setStatus(t.status);
    setTatamiCount(t.tatamiCount || 4);
    setRulesLabel((t as any).rulesLabel || '');
    setDescription(t.description || '');
    setSelectedDisciplines(
      t.disciplines && t.disciplines.length > 0
        ? t.disciplines
        : ['Кумитэ Индивидуальное (WKF)', 'Ката Индивидуальное (WKF)']
    );
    setImageUrl(t.imageUrl || '');
    setImageFileInfo(
      t.imageUrl
        ? {
            name: tr('Сохраненное изображение турнира', 'Сакталган мелдеш сүрөтү', 'Saved tournament image'),
            sizeKb: 'DB',
            format: t.imageUrl.endsWith('.webp') ? 'WebP' : 'JPG'
          }
        : null
    );
    setImageUploadError(null);
    setIsFormOpen(true);
    [60, 400].forEach((ms) => setTimeout(() => document.getElementById('tournament-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), ms));
  };

  React.useEffect(() => {
    if (!editRequestId) return;
    const t = tournaments.find((x) => x.id === editRequestId);
    if (t) handleStartEdit(t);
    onEditRequestHandled?.();
  }, [editRequestId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!createRequestId) return;
    resetForm();
    setIsFormOpen(true);
    [60, 400].forEach((ms) => setTimeout(() => document.getElementById('tournament-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), ms));
    onCreateRequestHandled?.();
  }, [createRequestId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick template filler
  const handleFillTemplate = (templateType: 'wkf_championship' | 'skif_cup' | 'youth_open') => {
    if (templateType === 'wkf_championship') {
      setTitle(tr('Открытый Кубок Азии по каратэ WKF 2026', 'Каратэ WKF боюнча Азия Ачык Кубогу 2026', 'WKF Asia Open Karate Cup 2026'));
      setOrganization('WKF & National Karate Federation');
      setRulesType('wkf');
      setVenueName(tr('Дворец спорта им. Кожомкула', 'Кожомкул атындагы Спорт Ордосу', 'Kozhomkul Sports Palace'));
      setCity(tr('Бишкек', 'Бишкек', 'Bishkek'));
      setCountry(tr('Кыргызстан', 'Кыргызстан', 'Kyrgyzstan'));
      setStartDate('2026-12-18');
      setEndDate('2026-12-20');
      setRegistrationDeadline('2026-12-10 23:59');
      setStatus('registration_open');
      setTatamiCount(6);
      setDescription(
        tr(
          'Международный турнир по правилам WKF. Электронное табло на каждом татами, результаты и сетки онлайн.',
          'WKF эрежелери боюнча эл аралык мелдеш. Ар бир татамиде электрондук табло, жыйынтыктар жана торчолор онлайн.',
          'International WKF tournament with an electronic scoreboard on every tatami and live results online.'
        )
      );
      setSelectedDisciplines([
        'Кумитэ Индивидуальное (WKF)',
        'Ката Индивидуальное (WKF)',
        'Командное Кумитэ',
        'Командное Ката'
      ]);
    } else if (templateType === 'skif_cup') {
      setTitle(tr('Открытый Кубок Сётокан SKIF 2026', 'Сётокан SKIF Ачык Кубогу 2026', 'Shotokan SKIF Open Cup 2026'));
      setOrganization('Shotokan Karate-Do International Federation');
      setRulesType('skif');
      setVenueName(tr('Центральная Арена Боевых Искусств', 'Борбордук Мушташ Өнөрү Аренасы', 'Central Martial Arts Arena'));
      setCity(tr('Алматы', 'Алматы', 'Almaty'));
      setCountry(tr('Казахстан', 'Казакстан', 'Kazakhstan'));
      setStartDate('2027-01-22');
      setEndDate('2027-01-24');
      setRegistrationDeadline('2027-01-15 20:00');
      setStatus('registration_open');
      setTatamiCount(4);
      setDescription(
        tr(
          'Традиционное первенство по правилам SKIF Shobu Ippon и Shobu Sanbon.',
          'SKIF Shobu Ippon жана Shobu Sanbon эрежелери боюнча салттуу биринчилик.',
          'Traditional championship governed by SKIF Shobu Ippon and Shobu Sanbon rules.'
        )
      );
      setSelectedDisciplines([
        'Сётокан Shobu Ippon',
        'Сётокан Shobu Sanbon',
        'Ката Индивидуальное (WKF)'
      ]);
    } else {
      setTitle(tr('Юношеский турнир «Надежды Каратэ» U10-U16', '«Каратэ Үмүттөрү» U10-U16 өспүрүмдөр мелдеши', 'Youth Karate Hopes Open U10-U16'));
      setOrganization('Youth Karate Federation');
      setRulesType('wkf');
      setVenueName(tr('Дворец Единоборств «Манас»', '«Манас» Мушташ Өнөрү Ордосу', 'Olymp Combat Sports Palace'));
      setCity(tr('Бишкек', 'Бишкек', 'Bishkek'));
      setCountry(tr('Кыргызстан', 'Кыргызстан', 'Kyrgyzstan'));
      setStartDate('2027-02-14');
      setEndDate('2027-02-15');
      setRegistrationDeadline('2027-02-07 18:00');
      setStatus('registration_open');
      setTatamiCount(4);
      setDescription(
        tr(
          'Детско-юношеские соревнования для возрастных категорий U10, U12 и Кадетов 14-15 лет.',
          'U10, U12 жана 14-15 жаштагы кадеттер үчүн балдар жана өспүрүмдөр мелдеши.',
          'Youth competition for U10, U12, and Cadet 14-15 age divisions.'
        )
      );
      setSelectedDisciplines([
        'Кумитэ Индивидуальное (WKF)',
        'Ката Индивидуальное (WKF)'
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showNotification(
        tr('Пожалуйста, укажите название турнира', 'Сураныч, мелдештин аталышын жазыңыз', 'Please enter the tournament title'),
        'error'
      );
      return;
    }
    if (!venueName.trim()) {
      showNotification(
        tr('Пожалуйста, укажите название арены или спорткомплекса', 'Сураныч, аренанын же спорткомплекстин атын жазыңыз', 'Please enter the venue or arena name'),
        'error'
      );
      return;
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim() || `tournament-${Date.now()}`;

    const cleanImageUrl = imageUrl.trim() || undefined;
    const isExpiredByDate = isTournamentDateExpired(endDate);
    const effectiveStatus: TournamentStatus = isExpiredByDate ? 'completed' : status;

    if (editingTournamentId) {
      const existing = tournaments.find((t) => t.id === editingTournamentId);
      const updated: Tournament = {
        ...existing,
        id: editingTournamentId,
        title: title.trim(),
        titleKy: titleKy.trim(),
        titleEn: titleEn.trim(),
        slug: existing?.slug || slug,
        organization: organization.trim(),
        rulesType,
        venueName: venueName.trim(),
        city: city.trim(),
        country: country.trim(),
        startDate,
        endDate,
        registrationDeadline,
        status: effectiveStatus,
        tatamiCount,
        rulesLabel: rulesLabel.trim() || undefined,
        disciplines: selectedDisciplines,
        description: description.trim() || tr('Официальные соревнования по каратэ.', 'Каратэ боюнча расмий мелдеш.', 'Official karate championship.'),
        imageUrl: cleanImageUrl,
        ...(cleanImageUrl ? { emblemType: 'custom_upload' } : {}),
        athleteCount: existing?.athleteCount || 0,
        clubCount: existing?.clubCount || 0
      } as Tournament;

      onUpdateTournament(updated);
      if (isExpiredByDate) {
        setRegistryViewTab('archive');
        showNotification(
          tr(
            `Турнир «${updated.title}» автоматически перемещён во вкладку «Архив» (срок ${endDate} истёк).`,
            `«${updated.title}» мелдеши автоматтык түрдө «Архив» өтмөгүнө жылдырылды (мөөнөтү ${endDate} өттү).`,
            `Tournament "${updated.title}" automatically moved to the "Archive" tab (end date ${endDate} passed).`
          )
        );
      } else {
        showNotification(
          tr(
            `Турнир «${updated.title}» успешно обновлен в БД!`,
            `«${updated.title}» мелдеши ийгиликтүү жаңыртылды!`,
            `Tournament "${updated.title}" updated in database!`
          )
        );
      }
    } else {
      const newTournament: Tournament = {
        id: `tourn_${Date.now()}`,
        title: title.trim(),
        titleKy: titleKy.trim() || undefined,
        titleEn: titleEn.trim() || undefined,
        slug,
        organization: organization.trim(),
        rulesType,
        venueName: venueName.trim(),
        city: city.trim(),
        country: country.trim(),
        startDate,
        endDate,
        registrationDeadline,
        status: effectiveStatus,
        tatamiCount,
        rulesLabel: rulesLabel.trim() || undefined,
        disciplines: selectedDisciplines,
        description: description.trim() || tr('Официальные соревнования по каратэ.', 'Каратэ боюнча расмий мелдеш.', 'Official karate championship.'),
        imageUrl: cleanImageUrl,
        ...(cleanImageUrl ? { emblemType: 'custom_upload' } : {}),
        athleteCount: 0,
        clubCount: 0,
        scheduleSummary: [
          { time: '08:30 - 09:30', title: 'Мандатная комиссия и электронное взвешивание', stage: 'Секретариат' },
          { time: '10:00 - 13:00', title: 'Предварительные поединки и Ката', stage: `Татами 1-${tatamiCount}` },
          { time: '14:00 - 17:30', title: 'Полуфиналы и Финальные поединки', stage: 'Главный ковер' },
          { time: '18:00 - 19:00', title: 'Торжественное награждение и пьедестал', stage: 'Подиум арены' }
        ]
      } as Tournament;

      onAddTournament(newTournament);
      if (onSelectTournament) {
        onSelectTournament(newTournament);
      }
      if (isExpiredByDate) {
        setRegistryViewTab('archive');
        showNotification(
          tr(
            `Турнир «${newTournament.title}» сохранен и автоматически перенесён во вкладку «Архив» (срок ${endDate} истёк).`,
            `«${newTournament.title}» мелдеши сакталды жана автоматтык түрдө «Архив» өтмөгүнө которулду (мөөнөтү ${endDate} өттү).`,
            `Tournament "${newTournament.title}" saved and automatically moved to the "Archive" tab (end date ${endDate} passed).`
          )
        );
      } else {
        setRegistryViewTab('active');
        showNotification(
          tr(
            `Новый турнир «${newTournament.title}» успешно создан и сохранен в базе данных!`,
            `«${newTournament.title}» жаңы мелдеши түзүлүп, маалымат базасына сакталды!`,
            `New tournament "${newTournament.title}" created and saved to database!`
          )
        );
      }
    }

    // Trigger global date check listener immediately
    window.dispatchEvent(new CustomEvent('apsatarov-check-expired-events'));
    resetForm();
    setIsFormOpen(false);
  };

  const handleRequestDelete = (t: Tournament) => {
    setTournamentPendingDelete(t);
  };

  const handleConfirmDeleteYes = () => {
    if (!tournamentPendingDelete || !onDeleteTournament) {
      setTournamentPendingDelete(null);
      return;
    }
    const target = tournamentPendingDelete;
    setTournamentPendingDelete(null);
    onDeleteTournament(target.id);
    showNotification(
      tr(
        `DELETE запрос выполнен: турнир «${target.title}» удален из базы данных и списка событий.`,
        `DELETE сурамы аткарылды: «${target.title}» мелдеши маалымат базасынан жана тизмеден өчүрүлдү.`,
        `DELETE request completed: tournament "${target.title}" removed from database and events list.`
      ),
      'error'
    );
  };

  const handleCancelDeleteNo = () => {
    setTournamentPendingDelete(null);
  };

  const activeTournaments = tournaments.filter((t) => !isTournamentArchived(t));
  const archivedTournaments = tournaments.filter((t) => isTournamentArchived(t));
  // Current: the nearest tournament first. Archive: the most recent first.
  const byStart = (a: Tournament, b: Tournament) => (a.startDate || '').localeCompare(b.startDate || '');
  const displayedTournaments =
    registryViewTab === 'archive' ? [...archivedTournaments].sort((a, b) => byStart(b, a)) : [...activeTournaments].sort(byStart);

  const getStatusBadge = (st: TournamentStatus) => {
    switch (st) {
      case 'registration_open':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-600/70 text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {tr('Регистрация открыта', 'Каттоо ачык', 'Registration Open')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-600/70 text-rose-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            {tr('Идет турнир (LIVE)', 'Мелдеш жүрүүдө (LIVE)', 'In Progress (LIVE)')}
          </span>
        );
      case 'draw_completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 border border-blue-600/70 text-blue-400 flex items-center gap-1">
            {tr('Сетки сформированы', 'Торчолор түзүлдү', 'Brackets Ready')}
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-400">
            {tr('Завершен', 'Аяктады', 'Completed')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-600/70 text-amber-400">
            {tr('Черновик', 'Долбоор', 'Draft')}
          </span>
        );
    }
  };

  const getRulesBadge = (r: TournamentRules) => {
    switch (r) {
      case 'wkf':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">WKF</span>;
      case 'skif':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">SKIF</span>;
      case 'kyokushin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">KYOKUSHIN</span>;
      case 'jka':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">JKA</span>;
      case 'olympic':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">OLYMPIC</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-white">WKF</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs shadow-xl transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/80 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--app-text-primary)]">
            {isAdmin
              ? tr('Турниры и пользователи', 'Мелдештер жана колдонуучулар', 'Tournaments & users')
              : tr('Турниры', 'Мелдештер', 'Tournaments')}
          </h2>
          <p className="text-sm text-[var(--app-text-muted)] mt-1">
            {isAdmin
              ? tr(
                  'Создавайте и меняйте турниры. Ниже — пользователи, ссылки для регистрации и резервная копия.',
                  'Мелдештерди түзүп, өзгөртүңүз. Төмөндө — колдонуучулар, каттоо шилтемелери жана резервдик көчүрмө.',
                  'Create and edit tournaments. Below: users, sign-up links and backup.'
                )
              : tr('Актуальные и прошедшие турниры.', 'Актуалдуу жана өткөн мелдештер.', 'Current and past tournaments.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                if (isFormOpen && !editingTournamentId) {
                  setIsFormOpen(false);
                } else {
                  resetForm();
                  setIsFormOpen(true);
                }
              }}
              className="h-11 px-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              {isFormOpen && !editingTournamentId ? (
                <>
                  <X className="w-4 h-4" />
                  <span>{tr('Скрыть форму', 'Форманы жашыруу', 'Hide Form')}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{tr('Создать турнир', 'Мелдеш түзүү', 'Create tournament')}</span>
                </>
              )}
            </button>
          ) : (
            <span className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{tr('Изменение и удаление заблокировано (RBAC)', 'Өзгөртүү жана өчүрүү кулпуланган (RBAC)', 'Edit & Delete Locked (RBAC)')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Form: Create or Edit Tournament (Administrator Only) */}
      {isAdmin && isFormOpen && (
        <div id="tournament-form" className="scroll-mt-20 max-w-4xl mx-auto p-5 sm:p-6 rounded-3xl bg-[var(--app-surface)] border border-[var(--app-border)] shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col gap-2.5 pb-3 border-b border-[var(--app-border)]">
            <div>
              <h3 className="text-xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[var(--accent)]" />
                <span>
                  {editingTournamentId
                    ? tr('Редактирование турнира', 'Мелдешти түзөтүү', 'Edit Tournament')
                    : tr('Создание нового турнира', 'Жаңы мелдеш түзүү', 'Create New Tournament')}
                </span>
              </h3>
              <p className="text-sm text-[var(--app-text-muted)] mt-0.5">
                {tr('Поля со звёздочкой обязательны', 'Жылдызчасы бар талаалар милдеттүү', 'Fields marked * are required')}
              </p>
            </div>

            {/* Quick Templates Buttons */}
            {!editingTournamentId && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] text-[var(--app-text-muted)] mr-1">
                  {tr('Быстрый шаблон:', 'Тез үлгү:', 'Quick template:')}
                </span>
                <button
                  type="button"
                  onClick={() => handleFillTemplate('wkf_championship')}
                  className="h-8 px-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[13px] font-medium text-[var(--app-text-secondary)] transition-colors cursor-pointer"
                >
                  {tr('Кубок WKF', 'WKF Кубогу', 'WKF Cup')}
                </button>
                <button
                  type="button"
                  onClick={() => handleFillTemplate('skif_cup')}
                  className="h-8 px-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[13px] font-medium text-[var(--app-text-secondary)] transition-colors cursor-pointer"
                >
                  {tr('Сётокан SKIF', 'Сётокан SKIF', 'Shotokan SKIF')}
                </button>
                <button
                  type="button"
                  onClick={() => handleFillTemplate('youth_open')}
                  className="h-8 px-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[13px] font-medium text-[var(--app-text-secondary)] transition-colors cursor-pointer"
                >
                  {tr('Юношеский WKF', 'Өспүрүмдөр WKF', 'Youth WKF')}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Title & Organization */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8">
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Название соревнования', 'Мелдештин аталышы', 'Tournament Title')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={tr('напр. Открытый Кубок по каратэ WKF 2026', 'мис. Каратэ WKF боюнча Ачык Кубок 2026', 'e.g. Open WKF Karate Cup 2026')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Организатор / Федерация', 'Уюштуруучу / Федерация', 'Organizer / Federation')}
                </label>
                <input
                  type="text"
                  placeholder="WKF National Federation"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>
            </div>

            {/* Names in Kyrgyz and English: shown when the site is switched to that language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Название на кыргызском', 'Кыргызча аталышы', 'Title in Kyrgyz')}{' '}
                  <span className="font-normal text-[var(--app-text-muted)]">{tr('(по желанию)', '(каалоо боюнча)', '(optional)')}</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder={tr('напр. Каратэ WKF боюнча Ачык Кубок 2026', 'мис. Каратэ WKF боюнча Ачык Кубок 2026', 'e.g. Каратэ WKF боюнча Ачык Кубок 2026')}
                  value={titleKy}
                  onChange={(e) => setTitleKy(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Название на английском', 'Англисче аталышы', 'Title in English')}{' '}
                  <span className="font-normal text-[var(--app-text-muted)]">{tr('(по желанию)', '(каалоо боюнча)', '(optional)')}</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Open WKF Karate Cup 2026"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>
              <p className="md:col-span-2 -mt-1 text-xs text-[var(--app-text-muted)]">
                {tr(
                  'Если поле пустое, на этом языке покажется название на русском. Город и страна переводятся сами.',
                  'Талаа бош болсо, бул тилде орусча аталышы көрсөтүлөт. Шаар жана өлкө өзү которулат.',
                  'If empty, the Russian title is shown in that language. City and country are translated automatically.'
                )}
              </p>
            </div>

            {/* Row 2: Event image — one compact row (JPG/WebP up to 2 MB) */}
            <div>
              <input
                ref={fileInputRef}
                id="tournament-event-image-input"
                type="file"
                accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
                onChange={handleEventImageUpload}
                className="sr-only"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropImage}
                className={`flex items-center gap-3 rounded-2xl border border-dashed p-2.5 transition ${
                  isDragOver ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--app-border)] bg-[var(--app-surface-subtle)]'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => handleTriggerFilePicker(e)}
                  className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-[var(--app-surface)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text-muted)] cursor-pointer"
                  aria-label={tr('Выбрать фото', 'Сүрөт тандоо', 'Choose image')}
                >
                  {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--app-text-primary)]">
                    {isUploadingImage
                      ? tr('Загружаю…', 'Жүктөлүүдө…', 'Uploading…')
                      : imageUrl
                        ? tr('Фото турнира добавлено', 'Мелдештин сүрөтү кошулду', 'Tournament image added')
                        : tr('Фото турнира (необязательно)', 'Мелдештин сүрөтү (милдеттүү эмес)', 'Tournament image (optional)')}
                  </div>
                  <div className="text-xs text-[var(--app-text-muted)] truncate">
                    {imageFileInfo ? `${imageFileInfo.format} · ${imageFileInfo.sizeKb}` : tr('JPG или WebP, до 2 МБ', 'JPG же WebP, 2 МБ чейин', 'JPG or WebP, up to 2 MB')}
                  </div>
                </div>
                {imageUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageFileInfo(null);
                      setImageUploadError(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="h-9 px-3 rounded-full border border-[var(--app-border)] text-xs font-medium text-[var(--app-text-secondary)] hover:text-red-600 hover:border-red-300 cursor-pointer shrink-0"
                  >
                    {tr('Убрать', 'Алып салуу', 'Remove')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleTriggerFilePicker(e)}
                    className="h-9 px-4 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    {tr('Выбрать', 'Тандоо', 'Choose')}
                  </button>
                )}
              </div>
              {imageUploadError && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageUploadError}</span>
                </div>
              )}
            </div>

            {/* Row 3: Rules, Status, Tatami Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Правила и регламент', 'Эрежелер жана регламент', 'Rules & Regulations')} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={rulesType}
                  onChange={(e) => setRulesType(e.target.value as TournamentRules)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                >
                  <option value="wkf">WKF (World Karate Federation)</option>
                  <option value="skif">SKIF (Shotokan Shobu Ippon / Sanbon)</option>
                  <option value="kyokushin">Kyokushin (Full Contact Knockdown)</option>
                  <option value="jka">JKA (Japan Karate Association)</option>
                  <option value="olympic">Olympic WKF (Repechage)</option>
                </select>
                <input
                  type="text"
                  value={rulesLabel}
                  onChange={(e) => setRulesLabel(e.target.value)}
                  placeholder={tr('Или свои правила, напр. ФКР 2026', 'Же өз эрежелериңиз', 'Or your own rules')}
                  className="mt-2 w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Статус турнира', 'Мелдештин статусу', 'Tournament Status')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                >
                  <option value="registration_open">{tr('Регистрация открыта', 'Каттоо ачык', 'Registration Open')}</option>
                  <option value="in_progress">{tr('Идет соревнование (LIVE)', 'Мелдеш жүрүүдө (LIVE)', 'In Progress (LIVE)')}</option>
                  <option value="draw_completed">{tr('Жеребьевка завершена', 'Чүчүкулак аяктады', 'Draw Completed')}</option>
                  <option value="draft">{tr('Черновик (подготовка)', 'Долбоор (даярдоо)', 'Draft')}</option>
                  <option value="completed">{tr('Завершен', 'Аяктады', 'Completed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Татами (площадок)', 'Татамилердин саны', 'Tatamis')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tatamiText}
                  onChange={(e) => setTatamiText(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  onBlur={() => setTatamiText(String(tatamiCount))}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>
            </div>

            {/* Row 4: Dates & Registration Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Дата начала', 'Башталуу датасы', 'Start Date')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Дата окончания', 'Аяктоо датасы', 'End Date')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
                {isTournamentDateExpired(endDate) && (
                  <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      {tr(
                        'Дата завершения в прошлом: событие не удалится автоматически, админ получит напоминание.',
                        'Аяктоо датасы өткөн: мелдеш автоматтык түрдө өчүрүлбөйт, админге эскертме келет.',
                        'End date is in the past: event will not be auto-deleted; admin will receive a reminder.'
                      )}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Дедлайн подачи заявок', 'Өтүнмөлөрдүн акыркы мөөнөтү', 'Registration Deadline')}
                </label>
                <input
                  type="text"
                  placeholder="2026-11-28 23:59"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>
            </div>

            {/* Row 5: Location (Country, City, Venue) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Страна', 'Өлкө', 'Country')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={tr('Кыргызстан', 'Кыргызстан', 'Kyrgyzstan')}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Город', 'Шаар', 'City')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={tr('Бишкек', 'Бишкек', 'Bishkek')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                  {tr('Арена / Спорткомплекс', 'Арена / Спорткомплекс', 'Venue / Sports Arena')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={tr('напр. Дворец спорта им. Кожомкула', 'мис. Кожомкул атындагы Спорт Ордосу', 'e.g. National Sports Arena')}
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
                />
              </div>
            </div>

            {/* Row 6: Disciplines selection */}
            <div>
              <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-2">
                {tr('Соревновательные дисциплины в программе:', 'Программадагы мелдеш дисциплиналары:', 'Competition Disciplines:')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[...availableDisciplinesList, ...selectedDisciplines.filter((d) => !availableDisciplinesList.includes(d))].map((disc) => {
                  const isChecked = selectedDisciplines.includes(disc);
                  return (
                    <button
                      key={disc}
                      type="button"
                      onClick={() => toggleDiscipline(disc)}
                      className={`h-9 px-3.5 rounded-full text-sm transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isChecked
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white font-semibold shadow-sm'
                          : 'bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                      <span>{disciplineLabel(disc, language)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 -mt-2">
              <input
                type="text"
                value={customDiscipline}
                onChange={(e) => setCustomDiscipline(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const d = customDiscipline.trim();
                    if (d && !selectedDisciplines.includes(d)) setSelectedDisciplines([...selectedDisciplines, d]);
                    setCustomDiscipline('');
                  }
                }}
                placeholder={tr('Своя дисциплина: напр. «Кихон», «Фукуго», «Тамешивари»', 'Өз дисциплинаңыз', 'Your own discipline')}
                className="flex-1 h-11 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl px-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition"
              />
              <button
                type="button"
                onClick={() => {
                  const d = customDiscipline.trim();
                  if (d && !selectedDisciplines.includes(d)) setSelectedDisciplines([...selectedDisciplines, d]);
                  setCustomDiscipline('');
                }}
                className="h-11 px-4 rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] text-sm font-semibold cursor-pointer"
              >
                {tr('+ Добавить', '+ Кошуу', '+ Add')}
              </button>
            </div>

            {/* Row 7: Description */}
            <div>
              <label className="block text-sm font-semibold text-[var(--app-text-primary)] mb-1.5">
                {tr('Описание турнира и регламент допуска', 'Мелдештин сүрөттөлүшү жана регламенти', 'Tournament Description & Regulations')}
              </label>
              <textarea
                rows={2}
                placeholder={tr(
                  'Укажите правила допуска, возрастные и весовые рамки, особенности взвешивания...',
                  'Катышуу эрежелерин, жаш жана салмак чектерин, таразага тартуу тартибин жазыңыз...',
                  'Specify eligibility rules, age and weight classes, weigh-in details...'
                )}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-3.5 text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] leading-relaxed"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--app-border)]">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="h-11 px-5 rounded-full border border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] text-sm font-semibold transition-colors cursor-pointer"
              >
                {tr('Отмена', 'Жокко чыгаруу', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isUploadingImage}
                className="h-11 px-6 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-[15px] font-bold transition-all shadow-md shadow-[var(--accent-soft)] cursor-pointer disabled:opacity-50"
              >
                {editingTournamentId
                  ? tr('Сохранить изменения', 'Өзгөртүүлөрдү сактоо', 'Save Changes')
                  : tr('+ Создать турнир', '+ Мелдеш түзүү', '+ Create Tournament')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Concluded tournaments: a small button on the right shows the archive */}
      {archivedTournaments.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => (registryViewTab === 'archive' && showTournamentList ? setRegistryViewTab('active') : openArchive())}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-medium text-[var(--app-text-secondary)] hover:border-amber-500 hover:text-amber-700 transition-colors cursor-pointer"
            title={tr(
              'Турниры, у которых прошли даты, автоматически переносятся в архив (не удаляются). Удалить можно в архиве с подтверждением.',
              'Мөөнөтү өткөн мелдештер архивге автоматтык түрдө которулат (өчүрүлбөйт). Архивде тастыктоо менен өчүрсө болот.',
              'Tournaments whose dates have passed move to the archive automatically (not deleted). You can delete them in the archive with confirmation.'
            )}
          >
            <Archive className="w-3.5 h-3.5 text-amber-600" />
            {registryViewTab === 'archive' && showTournamentList
              ? tr('Показать актуальные', 'Актуалдууларды көрсөтүү', 'Show current')
              : tr('Архив завершённых турниров', 'Аяктаган мелдештер архиви', 'Concluded tournaments archive')}
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500/15 text-amber-700 text-[11px] font-semibold inline-flex items-center justify-center">
              {archivedTournaments.length}
            </span>
          </button>
        </div>
      )}

      {/* Tournaments list: «Все турниры» opens and closes it; compact cards, three per row on wide screens */}
      <div ref={tournamentListRef} className="scroll-mt-20 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowTournamentList((v) => !v)}
            aria-expanded={showTournamentList}
            className={`inline-flex items-center gap-2 h-10 pl-3 pr-3.5 rounded-full border text-[15px] font-bold cursor-pointer transition ${
              showTournamentList
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                : 'bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text-primary)] hover:border-[var(--accent)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            {tr('Все турниры', 'Бардык мелдештер', 'All tournaments')}
            <span className={`tabular-nums ${showTournamentList ? 'text-white/80' : 'text-[var(--app-text-muted)]'}`}>{tournaments.length}</span>
            {showTournamentList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
          </button>

          {showTournamentList && (
            <div className="inline-flex items-center p-1 rounded-full bg-[var(--app-surface-subtle)] border border-[var(--app-border)] gap-1">
              {(
                [
                  ['active', tr('Актуальные', 'Актуалдуу', 'Current'), activeTournaments.length, Trophy],
                  ['archive', tr('Архив', 'Архив', 'Archive'), archivedTournaments.length, Archive]
                ] as const
              ).map(([id, label, count, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRegistryViewTab(id)}
                  className={`h-8 px-3 rounded-full text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                    registryViewTab === id
                      ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-sm'
                      : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span className="tabular-nums text-[var(--app-text-muted)]">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!showTournamentList ? (
          <p className="text-sm text-[var(--app-text-muted)]">
            {tr('Нажмите «Все турниры», чтобы открыть список. Нажмите ещё раз, чтобы закрыть.', 'Тизмени ачуу үчүн «Бардык мелдештер» басыңыз. Жабуу үчүн дагы бир жолу басыңыз.', 'Tap «All tournaments» to open the list, tap again to close it.')}
          </p>
        ) : displayedTournaments.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[var(--app-border)] text-center">
            <Archive className="w-6 h-6 text-[var(--app-text-muted)] mx-auto" />
            <div className="mt-2 text-sm font-semibold text-[var(--app-text-primary)]">
              {registryViewTab === 'archive'
                ? tr('В архиве пока нет турниров', 'Архивде азырынча мелдештер жок', 'No tournaments in the archive yet')
                : tr('Нет актуальных турниров', 'Актуалдуу мелдештер жок', 'No current tournaments')}
            </div>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">
              {registryViewTab === 'archive'
                ? tr('Сюда сами переходят турниры, дата окончания которых прошла.', 'Аяктоо датасы өткөн мелдештер бул жерге өзү которулат.', 'Tournaments move here after their end date.')
                : tr('Создайте турнир кнопкой «Создать турнир» выше.', 'Жогорудагы «Мелдеш түзүү» баскычы менен мелдеш түзүңүз.', 'Create one with the «Create tournament» button above.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedTournaments.map((t) => {
              const isSelected = selectedTournament?.id === t.id;
              const isExpired = isTournamentDateExpired(t.endDate);
              const isArchived = isTournamentArchived(t);
              const linkBtn = 'text-xs font-medium text-[var(--app-text-secondary)] hover:text-[var(--accent)] cursor-pointer inline-flex items-center gap-1';

              return (
                <div
                  key={t.id}
                  className={`min-w-0 p-3.5 rounded-2xl border flex flex-col gap-2.5 transition ${
                    isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)] bg-[var(--app-surface)]' : 'border-[var(--app-border)] bg-[var(--app-surface-subtle)] hover:border-[var(--accent)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getRulesBadge(t.rulesType)}
                        {getStatusBadge(isArchived ? 'completed' : t.status)}
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)] text-white">{tr('★ Выбран', '★ Тандалган', '★ Selected')}</span>
                        )}
                      </div>
                      <h4 className="mt-1.5 text-[15px] leading-snug font-bold text-[var(--app-text-primary)] line-clamp-2" title={t.title}>
                        {t.title}
                      </h4>
                    </div>
                    {t.imageUrl && <img src={t.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover border border-[var(--app-border)] shrink-0" />}
                  </div>

                  <div className="space-y-1 text-xs text-[var(--app-text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="tabular-nums">{t.startDate === t.endDate ? t.startDate : `${t.startDate} — ${t.endDate}`}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{[t.city, t.venueName].filter(Boolean).join(' · ')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {tr('Татами', 'Татами', 'Tatami')} {t.tatamiCount || 4} · {tr('атлетов', 'спортчу', 'athletes')} {t.athleteCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2.5 border-t border-[var(--app-border)] space-y-2">
                    <div className="flex gap-1.5">
                      {onSelectTournament && !isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectTournament(t)}
                          className="flex-1 h-8 px-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                        >
                          {tr('Выбрать', 'Тандоо', 'Select')}
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(t)}
                          className="flex-1 h-8 px-3 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {tr('Изменить', 'Өзгөртүү', 'Edit')}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {onNavigateToDetails && (
                        <button type="button" onClick={() => onNavigateToDetails(t)} className={linkBtn}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          {tr('Открыть', 'Ачуу', 'Open')}
                        </button>
                      )}
                      {isAdmin && !isArchived && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateTournament({ ...t, status: 'completed' });
                            showNotification(tr(`Турнир «${t.title}» перенесён в архив.`, `«${t.title}» мелдеши архивге которулду.`, `Tournament "${t.title}" moved to the archive.`));
                          }}
                          className={linkBtn}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          {tr('В архив', 'Архивге', 'Archive')}
                        </button>
                      )}
                      {isAdmin && isArchived && !isExpired && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateTournament({ ...t, status: 'registration_open' });
                            showNotification(tr(`Турнир «${t.title}» возвращён в актуальные.`, `«${t.title}» мелдеши актуалдууларга кайтарылды.`, `Tournament "${t.title}" restored.`));
                          }}
                          className={linkBtn}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {tr('Из архива', 'Архивден', 'Restore')}
                        </button>
                      )}
                      {isAdmin && onDeleteTournament && (
                        <button type="button" onClick={() => handleRequestDelete(t)} className={`${linkBtn} hover:!text-red-600 ml-auto`}>
                          <Trash2 className="w-3.5 h-3.5" />
                          {tr('Удалить', 'Өчүрүү', 'Delete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Tournament Confirmation Dialog Modal ("Да" / "Нет") */}
      {tournamentPendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={handleCancelDeleteNo}
        >
          <div
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-tournament-title"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 id="confirm-delete-tournament-title" className="text-base font-bold text-white">
                  {tr(
                    'Подтверждение удаления турнира',
                    'Мелдешти өчүрүүнү тастыктоо',
                    'Confirm Tournament Deletion'
                  )}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tr(
                    `Вы действительно хотите удалить турнир «${tournamentPendingDelete.title}» (${tournamentPendingDelete.startDate} — ${tournamentPendingDelete.endDate}) из базы данных?`,
                    `Сиз чын эле «${tournamentPendingDelete.title}» (${tournamentPendingDelete.startDate} — ${tournamentPendingDelete.endDate}) мелдешин маалымат базасынан өчүргүңүз келеби?`,
                    `Are you sure you want to delete the tournament "${tournamentPendingDelete.title}" (${tournamentPendingDelete.startDate} — ${tournamentPendingDelete.endDate}) from the database?`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCancelDeleteNo}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {tr('Нет', 'Жок', 'No')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteYes}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tr('Да', 'Ооба', 'Yes')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
