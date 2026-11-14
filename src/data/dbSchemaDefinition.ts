import { TableDef } from '../types/schema';

export const DATABASE_TABLES: TableDef[] = [
  {
    id: 'users',
    name: 'users',
    category: 'auth_org',
    russianName: 'Пользователи и персонал',
    description: 'Учётные записи судейской коллегии, секретарей татами, администраторов турнира и тренеров клубов с разделением прав (RBAC).',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'Уникальный идентификатор пользователя' },
      { name: 'email', type: 'VARCHAR(255)', nullable: false, defaultValue: '', description: 'Электронная почта (логин)' },
      { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, description: 'Хэш пароля (Argon2 / bcrypt)' },
      { name: 'full_name', type: 'VARCHAR(150)', nullable: false, description: 'ФИО пользователя / судьи / тренера' },
      { name: 'phone', type: 'VARCHAR(30)', nullable: true, description: 'Контактный телефон' },
      { name: 'role', type: 'user_role_enum', nullable: false, defaultValue: "'club_coach'", description: 'Роль: admin, chief_referee, tatami_referee, scorekeeper, club_coach, medical_officer' },
      { name: 'license_code', type: 'VARCHAR(50)', nullable: true, description: 'Номер судейской лицензии WKF / ФКР' },
      { name: 'referee_category', type: 'referee_category_enum', nullable: true, description: 'Судейская категория (МК-А, МК-В, ВК, 1К, 2К)' },
      { name: 'club_id', type: 'UUID', isFk: true, fkTarget: 'clubs.id', nullable: true, description: 'Привязка к клубу (для тренеров)' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Флаг активности учетной записи' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Дата и время регистрации' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Время последнего обновления' }
    ],
    indexes: [
      { name: 'idx_users_email_unique', columns: ['email'], isUnique: true, description: 'Уникальный индекс по email' },
      { name: 'idx_users_role', columns: ['role'], description: 'Быстрый поиск судей и секретарей' },
      { name: 'idx_users_club_id', columns: ['club_id'], description: 'Выборка тренеров клуба' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (email)',
      'FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL'
    ]
  },
  {
    id: 'tournaments',
    name: 'tournaments',
    category: 'auth_org',
    russianName: 'Турниры и соревнования',
    description: 'Основные параметры проводимого турнира: правила (WKF/Kyokushin), даты, локация, статус регистрации.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID турнира' },
      { name: 'title', type: 'VARCHAR(255)', nullable: false, description: 'Название турнира (Кубок / Первенство)' },
      { name: 'slug', type: 'VARCHAR(100)', nullable: false, description: 'URL-идентификатор турнира' },
      { name: 'rules_type', type: 'tournament_rules_enum', nullable: false, defaultValue: "'wkf'", description: 'Правила: wkf, kyokushin, olympic, jka' },
      { name: 'organization', type: 'VARCHAR(200)', nullable: false, description: 'Организатор (Федерация / Ассоциация)' },
      { name: 'venue_name', type: 'VARCHAR(200)', nullable: false, description: 'Арена / Спортивный комплекс' },
      { name: 'city', type: 'VARCHAR(100)', nullable: false, description: 'Город проведения' },
      { name: 'country', type: 'VARCHAR(100)', nullable: false, defaultValue: "'Россия'", description: 'Страна' },
      { name: 'start_date', type: 'DATE', nullable: false, description: 'Дата начала турнира' },
      { name: 'end_date', type: 'DATE', nullable: false, description: 'Дата завершения турнира' },
      { name: 'registration_deadline', type: 'TIMESTAMPTZ', nullable: false, description: 'Дедлайн подачи заявок' },
      { name: 'status', type: 'tournament_status_enum', nullable: false, defaultValue: "'draft'", description: 'Статус: draft, registration_open, draw_completed, in_progress, completed' },
      { name: 'image_url', type: 'VARCHAR(500)', nullable: true, description: 'Ссылка на загруженное изображение события (формат JPG или WebP, макс. 2 МБ)' },
      { name: 'chief_referee_id', type: 'UUID', isFk: true, fkTarget: 'users.id', nullable: true, description: 'Главный судья турнира' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Дата создания турнира' }
    ],
    indexes: [
      { name: 'idx_tournaments_slug_unique', columns: ['slug'], isUnique: true, description: 'Поиск турнира по slug' },
      { name: 'idx_tournaments_dates_status', columns: ['start_date', 'status'], description: 'Фильтр активных и предстоящих турниров' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (slug)',
      'CHECK (end_date >= start_date)',
      'FOREIGN KEY (chief_referee_id) REFERENCES users(id) ON DELETE SET NULL'
    ]
  },
  {
    id: 'clubs',
    name: 'clubs',
    category: 'auth_org',
    russianName: 'Клубы, додзё и школы',
    description: 'Организации и спортивные клубы, заявляющие спортсменов на турнир.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID клуба' },
      { name: 'name', type: 'VARCHAR(150)', nullable: false, description: 'Наименование клуба / додзё' },
      { name: 'short_code', type: 'VARCHAR(10)', nullable: false, description: 'Аббревиатура (SMR, BSH, OLMP)' },
      { name: 'city', type: 'VARCHAR(100)', nullable: false, description: 'Город' },
      { name: 'region', type: 'VARCHAR(100)', nullable: true, description: 'Область / Субъект федерации' },
      { name: 'head_coach_name', type: 'VARCHAR(150)', nullable: false, description: 'ФИО главного тренера' },
      { name: 'contact_phone', type: 'VARCHAR(30)', nullable: true, description: 'Контактный телефон клуба' },
      { name: 'contact_email', type: 'VARCHAR(255)', nullable: true, description: 'Email клуба' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Дата добавления в базу' }
    ],
    indexes: [
      { name: 'idx_clubs_short_code', columns: ['short_code'], isUnique: true, description: 'Уникальный код команды' },
      { name: 'idx_clubs_city', columns: ['city'], description: 'Группировка по городам' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (short_code)'
    ]
  },
  {
    id: 'age_categories',
    name: 'age_categories',
    category: 'athletes_categories',
    russianName: 'Возрастные категории',
    description: 'Официальные возрастные диапазоны (Дети, Кадеты, Юниоры, Взрослые, Ветераны) с регламентом времени боя.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID возрастной категории' },
      { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Название (напр. "Кадеты 14-15 лет")' },
      { name: 'code', type: 'VARCHAR(30)', nullable: false, description: 'Код категории (U10, CADET_14_15, SENIOR)' },
      { name: 'min_age', type: 'SMALLINT', nullable: false, description: 'Минимальный возраст (включительно)' },
      { name: 'max_age', type: 'SMALLINT', nullable: true, description: 'Максимальный возраст (NULL = без ограничений e.g. 18+)' },
      { name: 'match_duration_seconds', type: 'INTEGER', nullable: false, defaultValue: '120', description: 'Чистое время поединка в секундах (90с, 120с, 180с)' },
      { name: 'reference_rule', type: 'VARCHAR(50)', nullable: false, defaultValue: "'competition_day'", description: 'Определение возраста: на день соревнований или на 31 декабря' }
    ],
    indexes: [
      { name: 'idx_age_categories_code', columns: ['code'], isUnique: true, description: 'Уникальный код возраста' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (code)',
      'CHECK (min_age >= 5)',
      'CHECK (max_age IS NULL OR max_age >= min_age)'
    ]
  },
  {
    id: 'weight_categories',
    name: 'weight_categories',
    category: 'athletes_categories',
    russianName: 'Весовые категории',
    description: 'Весовые планки для каждого пола и возраста (например, Мужчины -67 кг, -75 кг, +84 кг).',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID весовой категории' },
      { name: 'age_category_id', type: 'UUID', isFk: true, fkTarget: 'age_categories.id', nullable: false, description: 'Ссылка на возрастную категорию' },
      { name: 'gender', type: 'gender_enum', nullable: false, description: 'Пол: male, female, mixed' },
      { name: 'name', type: 'VARCHAR(50)', nullable: false, description: 'Название ("-67 кг", "-75 кг", "+84 кг", "Абсолютная")' },
      { name: 'min_weight_kg', type: 'DECIMAL(5,2)', nullable: false, defaultValue: '0.00', description: 'Нижний предел веса в кг' },
      { name: 'max_weight_kg', type: 'DECIMAL(5,2)', nullable: true, description: 'Верхний предел (NULL для супертяжелого веса e.g. +84 кг)' },
      { name: 'is_open_weight', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Флаг абсолютной категории без ограничений по весу' }
    ],
    indexes: [
      { name: 'idx_weight_cat_age_gender', columns: ['age_category_id', 'gender'], description: 'Сетка весов по возрасту и полу' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'FOREIGN KEY (age_category_id) REFERENCES age_categories(id) ON DELETE CASCADE',
      'CHECK (max_weight_kg IS NULL OR max_weight_kg > min_weight_kg)'
    ]
  },
  {
    id: 'tournament_categories',
    name: 'tournament_categories',
    category: 'athletes_categories',
    russianName: 'Категории турнира (Дивизионы)',
    description: 'Конкретный дивизион турнира (Дисциплина Кумитэ/Ката + Пол + Возраст + Вес + Привязанное татами).',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID дивизиона турнира' },
      { name: 'tournament_id', type: 'UUID', isFk: true, fkTarget: 'tournaments.id', nullable: false, description: 'ID турнира' },
      { name: 'age_category_id', type: 'UUID', isFk: true, fkTarget: 'age_categories.id', nullable: false, description: 'ID возраста' },
      { name: 'weight_category_id', type: 'UUID', isFk: true, fkTarget: 'weight_categories.id', nullable: true, description: 'ID веса (NULL для Ката)' },
      { name: 'discipline', type: 'discipline_enum', nullable: false, defaultValue: "'kumite'", description: 'Дисциплина: kumite, kata, team_kumite, team_kata' },
      { name: 'gender', type: 'gender_enum', nullable: false, description: 'Пол участников' },
      { name: 'bracket_type', type: 'bracket_type_enum', nullable: false, defaultValue: "'olympic_with_repechage'", description: 'Тип сетки: олимпийская с утешением, круговая' },
      { name: 'assigned_tatami_id', type: 'UUID', isFk: true, fkTarget: 'tatamis.id', nullable: true, description: 'Основное татами для категории' },
      { name: 'status', type: 'category_status_enum', nullable: false, defaultValue: "'pending'", description: 'Статус: pending, draw_ready, running, finished' }
    ],
    indexes: [
      { name: 'idx_tourn_cat_tournament', columns: ['tournament_id', 'assigned_tatami_id'], description: 'Категории по турниру и татами' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE',
      'FOREIGN KEY (age_category_id) REFERENCES age_categories(id) ON DELETE RESTRICT',
      'FOREIGN KEY (weight_category_id) REFERENCES weight_categories(id) ON DELETE RESTRICT'
    ]
  },
  {
    id: 'participants',
    name: 'participants',
    category: 'athletes_categories',
    russianName: 'Участники и спортсмены',
    description: 'Заявленные спортсмены: антропометрия, клуб, пояс/дан, медицинский допуск и статус прохождения взвешивания.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID спортсмена' },
      { name: 'tournament_id', type: 'UUID', isFk: true, fkTarget: 'tournaments.id', nullable: false, description: 'ID турнира' },
      { name: 'club_id', type: 'UUID', isFk: true, fkTarget: 'clubs.id', nullable: false, description: 'Клуб спортсмена (обязательно)' },
      { name: 'city', type: 'VARCHAR(100)', nullable: false, description: 'Город проживания/клуба (обязательно)' },
      { name: 'country', type: 'VARCHAR(100)', nullable: false, defaultValue: "'Россия'", description: 'Страна спортсмена (обязательно)' },
      { name: 'first_name', type: 'VARCHAR(100)', nullable: false, description: 'Имя' },
      { name: 'last_name', type: 'VARCHAR(100)', nullable: false, description: 'Фамилия' },
      { name: 'gender', type: 'gender_enum', nullable: false, description: 'Пол (male / female)' },
      { name: 'birth_date', type: 'DATE', nullable: false, description: 'Дата рождения (для расчета возраста)' },
      { name: 'belt_rank', type: 'belt_rank_enum', nullable: false, description: 'Квалификация (кю / дан)' },
      { name: 'declared_weight_kg', type: 'DECIMAL(5,2)', nullable: false, description: 'Заявленный вес при регистрации' },
      { name: 'actual_weight_kg', type: 'DECIMAL(5,2)', nullable: true, description: 'Фактический вес на контрольном взвешивании' },
      { name: 'is_weighed_in', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Отметка о прохождении взвешивания' },
      { name: 'is_medical_cleared', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Медицинский допуск врача' },
      { name: 'license_number', type: 'VARCHAR(50)', nullable: false, description: 'Номер спортивного паспорта / лицензии' },
      { name: 'status', type: 'participant_status_enum', nullable: false, defaultValue: "'registered'", description: 'registered, weighed_in, draw_seeded, competing, disqualified, withdrawn' }
    ],
    indexes: [
      { name: 'idx_participants_tournament_club', columns: ['tournament_id', 'club_id'], description: 'Спортсмены турнира по клубам' },
      { name: 'idx_participants_birth_date', columns: ['birth_date'], description: 'Фильтр по году рождения' },
      { name: 'idx_participants_status', columns: ['status', 'is_weighed_in'], description: 'Контроль мандатной комиссии' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE',
      'FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE RESTRICT',
      'CHECK (declared_weight_kg > 15.0 AND declared_weight_kg < 250.0)',
      'CHECK (actual_weight_kg IS NULL OR (actual_weight_kg > 15.0 AND actual_weight_kg < 250.0))'
    ]
  },
  {
    id: 'category_entries',
    name: 'category_entries',
    category: 'athletes_categories',
    russianName: 'Заявки в категории (Посев)',
    description: 'Таблица связки многие-ко-многим: спортсмен заявлен в категорию турнира с номером жеребьевки и итоговым местом.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID записи в сетке' },
      { name: 'category_id', type: 'UUID', isFk: true, fkTarget: 'tournament_categories.id', nullable: false, description: 'ID категории' },
      { name: 'participant_id', type: 'UUID', isFk: true, fkTarget: 'participants.id', nullable: false, description: 'ID участника' },
      { name: 'seed_number', type: 'SMALLINT', nullable: true, description: 'Номер посева / жеребьевки (1, 2, 3...)' },
      { name: 'final_placement', type: 'placement_enum', nullable: true, description: 'Занятое место (1st_gold, 2nd_silver, 3rd_bronze_1, 3rd_bronze_2, 5th, 7th)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Дата включения в сетку' }
    ],
    indexes: [
      { name: 'idx_cat_entries_cat_participant', columns: ['category_id', 'participant_id'], isUnique: true, description: 'Защита от повторной заявки' },
      { name: 'idx_cat_entries_seed', columns: ['category_id', 'seed_number'], description: 'Порядок посева в турнирной сетке' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (category_id, participant_id)',
      'FOREIGN KEY (category_id) REFERENCES tournament_categories(id) ON DELETE CASCADE',
      'FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE'
    ]
  },
  {
    id: 'tatamis',
    name: 'tatamis',
    category: 'tatami_matches',
    russianName: 'Татами (Площадки)',
    description: 'Боевые площадки турнира: номер татами, зона, ответственные судьи и операторы табло.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID татами' },
      { name: 'tournament_id', type: 'UUID', isFk: true, fkTarget: 'tournaments.id', nullable: false, description: 'ID турнира' },
      { name: 'number', type: 'SMALLINT', nullable: false, description: 'Порядковый номер татами (1, 2, 3, 4)' },
      { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Наименование (напр. "Татами №1 (Центральный)")' },
      { name: 'location_zone', type: 'VARCHAR(100)', nullable: false, defaultValue: "'Главный зал'", description: 'Сектор арены' },
      { name: 'chief_judge_id', type: 'UUID', isFk: true, fkTarget: 'users.id', nullable: true, description: 'Старший судья татами' },
      { name: 'scorekeeper_id', type: 'UUID', isFk: true, fkTarget: 'users.id', nullable: true, description: 'Оператор табло / секретарь' },
      { name: 'status', type: 'tatami_status_enum', nullable: false, defaultValue: "'ready'", description: 'Статус: ready, active, paused, finished' }
    ],
    indexes: [
      { name: 'idx_tatami_tournament_num', columns: ['tournament_id', 'number'], isUnique: true, description: 'Уникальность номера татами в турнире' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (tournament_id, number)',
      'FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE',
      'FOREIGN KEY (chief_judge_id) REFERENCES users(id) ON DELETE SET NULL',
      'FOREIGN KEY (scorekeeper_id) REFERENCES users(id) ON DELETE SET NULL'
    ]
  },
  {
    id: 'bouts',
    name: 'bouts',
    category: 'tatami_matches',
    russianName: 'Поединки и расписание по татами',
    description: 'Ключевая таблица расписания и проведения боев: спортсмен Красный (AKA) против Синего (AO), татами, время, баллы, Senshu, штрафы и победитель.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID поединка' },
      { name: 'tournament_id', type: 'UUID', isFk: true, fkTarget: 'tournaments.id', nullable: false, description: 'ID турнира' },
      { name: 'category_id', type: 'UUID', isFk: true, fkTarget: 'tournament_categories.id', nullable: false, description: 'ID соревновательной категории' },
      { name: 'tatami_id', type: 'UUID', isFk: true, fkTarget: 'tatamis.id', nullable: false, description: 'Назначенное татами' },
      { name: 'bout_number', type: 'INTEGER', nullable: false, description: 'Сквозной номер боя на татами (101, 102, 103...)' },
      { name: 'round_stage', type: 'round_stage_enum', nullable: false, description: 'Стадия: 1/16, 1/8, 1/4, 1/2, repechage, bronze, final' },
      { name: 'bracket_position', type: 'INTEGER', nullable: false, description: 'Позиция в турнирной сетке' },
      { name: 'aka_participant_id', type: 'UUID', isFk: true, fkTarget: 'participants.id', nullable: true, description: 'Спортсмен АКА (Красный пояс)' },
      { name: 'ao_participant_id', type: 'UUID', isFk: true, fkTarget: 'participants.id', nullable: true, description: 'Спортсмен АО (Синий пояс)' },
      { name: 'scheduled_time', type: 'TIMESTAMPTZ', nullable: false, description: 'Плановое время начала поединка' },
      { name: 'actual_start_time', type: 'TIMESTAMPTZ', nullable: true, description: 'Фактическое время команды "Хадзимэ"' },
      { name: 'actual_end_time', type: 'TIMESTAMPTZ', nullable: true, description: 'Фактическое время команды "Ямэ" / финала' },
      { name: 'aka_score', type: 'SMALLINT', nullable: false, defaultValue: '0', description: 'Набранные баллы АКА (Юко=1, Ваза-ари=2, Иппон=3)' },
      { name: 'ao_score', type: 'SMALLINT', nullable: false, defaultValue: '0', description: 'Набранные баллы АО' },
      { name: 'aka_senshu', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Преимущество первого безответного балла (Senshu)' },
      { name: 'ao_senshu', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Senshu у спортсмена АО' },
      { name: 'aka_penalties_c1', type: 'SMALLINT', nullable: false, defaultValue: '0', description: 'Замечания Категории 1 (жесткий контакт)' },
      { name: 'ao_penalties_c1', type: 'SMALLINT', nullable: false, defaultValue: '0', description: 'Замечания C1 у АО' },
      { name: 'aka_penalties_c2', type: 'SMALLINT', nullable: false, defaultValue: '0', description: 'Замечания Категории 2 (выход за татами, уклонение)' },
      { name: 'ao_penalties_c2', type: 'SMALLINT', nullable: false, defaultValue: '0', description: 'Замечания C2 у АО' },
      { name: 'winner_id', type: 'UUID', isFk: true, fkTarget: 'participants.id', nullable: true, description: 'Объявленный победитель боя' },
      { name: 'win_reason', type: 'win_reason_enum', nullable: true, description: 'Причина: points_lead, senshu, hantei, ippon, hansoku, kiken' },
      { name: 'status', type: 'bout_status_enum', nullable: false, defaultValue: "'scheduled'", description: 'scheduled, waiting_competitors, in_progress, completed, cancelled' },
      { name: 'timer_seconds_remaining', type: 'INTEGER', nullable: false, defaultValue: '120', description: 'Остаток времени на табло в секундах' }
    ],
    indexes: [
      { name: 'idx_bouts_tatami_schedule', columns: ['tatami_id', 'scheduled_time', 'bout_number'], description: 'Основной индекс расписания татами' },
      { name: 'idx_bouts_category_bracket', columns: ['category_id', 'round_stage'], description: 'Выборка поединков турнирной сетки' },
      { name: 'idx_bouts_participants', columns: ['aka_participant_id', 'ao_participant_id'], description: 'Поиск боев конкретного спортсмена' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE',
      'FOREIGN KEY (category_id) REFERENCES tournament_categories(id) ON DELETE CASCADE',
      'FOREIGN KEY (tatami_id) REFERENCES tatamis(id) ON DELETE RESTRICT',
      'FOREIGN KEY (aka_participant_id) REFERENCES participants(id) ON DELETE SET NULL',
      'FOREIGN KEY (ao_participant_id) REFERENCES participants(id) ON DELETE SET NULL',
      'FOREIGN KEY (winner_id) REFERENCES participants(id) ON DELETE SET NULL',
      'CHECK (aka_score >= 0 AND ao_score >= 0)',
      'CHECK (NOT (aka_senshu AND ao_senshu)) -- Senshu может быть только у одного бойца'
    ]
  },
  {
    id: 'bout_scores',
    name: 'bout_scores',
    category: 'tatami_matches',
    russianName: 'Протокол действий и баллов боя',
    description: 'Журнал хронологических событий поединка (Юко, Ваза-ари, Иппон, замечания Чуй, Хансоку, вызовы врача, видеоповторы).',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID записи в протоколе' },
      { name: 'bout_id', type: 'UUID', isFk: true, fkTarget: 'bouts.id', nullable: false, description: 'ID поединка' },
      { name: 'match_second', type: 'SMALLINT', nullable: false, description: 'Секунда на таймере матча в момент действия' },
      { name: 'competitor_side', type: 'competitor_side_enum', nullable: false, description: 'Цвет пояса: aka или ao' },
      { name: 'participant_id', type: 'UUID', isFk: true, fkTarget: 'participants.id', nullable: false, description: 'Кому присужден балл/наказание' },
      { name: 'event_type', type: 'bout_event_type_enum', nullable: false, description: 'yuko_1, waza_ari_2, ippon_3, senshu, c1_warning, c2_warning, hansoku' },
      { name: 'points', type: 'SMALLINT', nullable: false, defaultValue: '0', description: 'Присужденные баллы (0, 1, 2, 3)' },
      { name: 'recorded_by_user_id', type: 'UUID', isFk: true, fkTarget: 'users.id', nullable: true, description: 'Секретарь, зафиксировавший действие' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Точное системное время фиксации' }
    ],
    indexes: [
      { name: 'idx_bout_scores_bout_id', columns: ['bout_id', 'match_second'], description: 'Хронология событий конкретного боя' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'FOREIGN KEY (bout_id) REFERENCES bouts(id) ON DELETE CASCADE',
      'FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE RESTRICT',
      'FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL'
    ]
  },
  {
    id: 'referee_assignments',
    name: 'referee_assignments',
    category: 'tatami_matches',
    russianName: 'Назначения судейских бригад',
    description: 'Бригада судей на конкретный бой: Сусин (рефери на ковре), Фукусин 1-4 (боковые судьи с флажками), Канса (арбитр видеоповтора).',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID судейского назначения' },
      { name: 'bout_id', type: 'UUID', isFk: true, fkTarget: 'bouts.id', nullable: false, description: 'ID поединка' },
      { name: 'user_id', type: 'UUID', isFk: true, fkTarget: 'users.id', nullable: false, description: 'ID судьи' },
      { name: 'referee_role', type: 'referee_role_enum', nullable: false, description: 'shushin, fukushin_1, fukushin_2, fukushin_3, fukushin_4, kansa' },
      { name: 'assigned_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Время назначения в бригаду' }
    ],
    indexes: [
      { name: 'idx_ref_assign_bout_role', columns: ['bout_id', 'referee_role'], isUnique: true, description: 'Уникальность позиции судьи в поединке' },
      { name: 'idx_ref_assign_user', columns: ['user_id'], description: 'История судейства рефери' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (bout_id, referee_role)',
      'FOREIGN KEY (bout_id) REFERENCES bouts(id) ON DELETE CASCADE',
      'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT'
    ]
  },
  {
    id: 'tournament_clubs',
    name: 'tournament_clubs',
    category: 'auth_org',
    russianName: 'Аккредитация клубов на турниры (Раздельный учёт)',
    description: 'Раздельный учёт участия клубов в турнирах: заявки команд, делегации, квоты атлетов, статус аккредитации и стартовые взносы.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID аккредитации' },
      { name: 'tournament_id', type: 'UUID', isFk: true, fkTarget: 'tournaments.id', nullable: false, description: 'ID турнира' },
      { name: 'club_id', type: 'UUID', isFk: true, fkTarget: 'clubs.id', nullable: false, description: 'ID клуба' },
      { name: 'team_leader_name', type: 'VARCHAR(150)', nullable: false, description: 'Представитель / Старший тренер команды на турнире' },
      { name: 'athletes_quota', type: 'INTEGER', nullable: false, defaultValue: '50', description: 'Квота спортсменов для клуба' },
      { name: 'athletes_admitted_count', type: 'INTEGER', nullable: false, defaultValue: '0', description: 'Фактически допущено спортсменов после мандатной комиссии' },
      { name: 'accreditation_status', type: 'VARCHAR(50)', nullable: false, defaultValue: "'pending'", description: 'pending, accredited, verified, rejected' },
      { name: 'fee_paid', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Статус оплаты стартового взноса команды' },
      { name: 'registered_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Дата подачи командной заявки' }
    ],
    indexes: [
      { name: 'idx_tourn_clubs_unique', columns: ['tournament_id', 'club_id'], isUnique: true, description: 'Уникальность аккредитации клуба на турнир' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (tournament_id, club_id)',
      'FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE',
      'FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE RESTRICT'
    ]
  },
  {
    id: 'referee_protocols',
    name: 'referee_protocols',
    category: 'tatami_matches',
    russianName: 'Судейские протоколы (Верификация боев)',
    description: 'Официальные судейские протоколы поединков и соревнований: подписи рефери (Сусин), арбитра (Канса), видеоповторы (VR) и протесты.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID судейского протокола' },
      { name: 'protocol_number', type: 'VARCHAR(50)', nullable: false, description: 'Уникальный номер бланка протокола (напр. PR-2026-T1-104)' },
      { name: 'bout_id', type: 'UUID', isFk: true, fkTarget: 'bouts.id', nullable: false, description: 'ID завершенного поединка' },
      { name: 'tournament_id', type: 'UUID', isFk: true, fkTarget: 'tournaments.id', nullable: false, description: 'ID турнира' },
      { name: 'category_id', type: 'UUID', isFk: true, fkTarget: 'tournament_categories.id', nullable: false, description: 'ID категории' },
      { name: 'discipline', type: 'discipline_enum', nullable: false, defaultValue: "'kumite'", description: 'Дисциплина: kumite, kata, team_kumite, team_kata' },
      { name: 'shushin_referee_id', type: 'UUID', isFk: true, fkTarget: 'users.id', nullable: false, description: 'Рефери на татами (Сусин)' },
      { name: 'kansa_arbitrator_id', type: 'UUID', isFk: true, fkTarget: 'users.id', nullable: false, description: 'Арбитр стола / Канса' },
      { name: 'score_summary', type: 'VARCHAR(100)', nullable: false, description: 'Итоговый счёт (напр. "4:2 (АКА + Senshu)")' },
      { name: 'winner_participant_id', type: 'UUID', isFk: true, fkTarget: 'participants.id', nullable: false, description: 'Официальный победитель' },
      { name: 'win_reason', type: 'win_reason_enum', nullable: false, description: 'Основание победы (points, senshu, ippon, hantei, hansoku)' },
      { name: 'video_review_used', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Факт использования системы видеоповтора (VR)' },
      { name: 'protest_filed', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Подавался ли официальный протест тренером' },
      { name: 'protest_status', type: 'VARCHAR(50)', nullable: true, description: 'none, filed, upheld (удовлетворен), dismissed (отклонен)' },
      { name: 'is_certified', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Заверен электронной подписью Главного судьи' },
      { name: 'certified_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Время подписания протокола' },
      { name: 'notes', type: 'TEXT', nullable: true, description: 'Официальные замечания судейской коллегии' }
    ],
    indexes: [
      { name: 'idx_ref_protocols_number', columns: ['protocol_number'], isUnique: true, description: 'Уникальность номера протокола' },
      { name: 'idx_ref_protocols_bout', columns: ['bout_id'], isUnique: true, description: 'Один официальный протокол на поединок' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (protocol_number)',
      'UNIQUE (bout_id)',
      'FOREIGN KEY (bout_id) REFERENCES bouts(id) ON DELETE CASCADE',
      'FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE',
      'FOREIGN KEY (category_id) REFERENCES tournament_categories(id) ON DELETE CASCADE',
      'FOREIGN KEY (shushin_referee_id) REFERENCES users(id) ON DELETE RESTRICT',
      'FOREIGN KEY (kansa_arbitrator_id) REFERENCES users(id) ON DELETE RESTRICT',
      'FOREIGN KEY (winner_participant_id) REFERENCES participants(id) ON DELETE RESTRICT'
    ]
  },
  {
    id: 'kata_scores',
    name: 'kata_scores',
    category: 'tatami_matches',
    russianName: 'Судейские оценки Ката (WKF / SKIF)',
    description: 'Оценки судейской коллегии в дисциплине Ката: 5 или 7 судей, отбрасывание крайних оценок, коэффициенты техники (70%) и атлетизма (30%).',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, nullable: false, defaultValue: 'gen_random_uuid()', description: 'ID протокола ката' },
      { name: 'bout_id', type: 'UUID', isFk: true, fkTarget: 'bouts.id', nullable: false, description: 'ID матча/выступления' },
      { name: 'participant_id', type: 'UUID', isFk: true, fkTarget: 'participants.id', nullable: false, description: 'Выступающий спортсмен' },
      { name: 'kata_name', type: 'VARCHAR(100)', nullable: false, description: 'Исполняемое ката (напр. "Anan", "Papuren", "Kanku Dai")' },
      { name: 'judge_scores', type: 'DECIMAL(3,1)[]', nullable: false, description: 'Массив оценок судей (напр. [7.6, 7.8, 8.0, 7.7, 7.9])' },
      { name: 'trimmed_min_score', type: 'DECIMAL(3,1)', nullable: false, description: 'Отброшенная низшая оценка' },
      { name: 'trimmed_max_score', type: 'DECIMAL(3,1)', nullable: false, description: 'Отброшенная высшая оценка' },
      { name: 'technical_score', type: 'DECIMAL(4,2)', nullable: false, description: 'Техническая оценка (вес 70%)' },
      { name: 'athletic_score', type: 'DECIMAL(4,2)', nullable: false, description: 'Атлетическая оценка (вес 30%)' },
      { name: 'final_score', type: 'DECIMAL(5,2)', nullable: false, description: 'Итоговый балл выступления Ката' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', description: 'Время фиксации судейских оценок' }
    ],
    indexes: [
      { name: 'idx_kata_scores_bout_participant', columns: ['bout_id', 'participant_id'], isUnique: true, description: 'Оценка участника в матче Ката' }
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'UNIQUE (bout_id, participant_id)',
      'FOREIGN KEY (bout_id) REFERENCES bouts(id) ON DELETE CASCADE',
      'FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE',
      'CHECK (final_score > 0.0 AND final_score <= 30.0)'
    ]
  }
];

export const POSTGRESQL_DDL_SCRIPT = `-- =====================================================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ СИСТЕМЫ УПРАВЛЕНИЯ ТУРНИРАМИ ПО КАРАТЭ (WKF / ФКР)
-- Включает: Пользователи, Участники, Категории (Возраст/Вес), Расписание по татами
-- СУБД: PostgreSQL 14+
-- =====================================================================

-- Подключение расширения для генерации UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. ПОЛЬЗОВАТЕЛЬСКИЕ ТИПЫ ДАННЫХ И ENUM-ПЕРЕЧИСЛЕНИЯ
-- ---------------------------------------------------------------------

CREATE TYPE user_role_enum AS ENUM (
    'admin',            -- Главный администратор системы
    'chief_referee',    -- Главный судья турнира
    'tatami_referee',   -- Судья на татами (Рефери / Боковой судья)
    'scorekeeper',      -- Оператор электронного табло / Секретарь
    'club_coach',       -- Тренер / Представитель команды
    'medical_officer'   -- Главный врач соревнований
);

CREATE TYPE referee_category_enum AS ENUM (
    'international_a',  -- WKF Международная категория А
    'international_b',  -- WKF Международная категория В
    'national_1',       -- Всероссийская категория
    'national_2',       -- Первая категория
    'regional'          -- Региональная категория
);

CREATE TYPE tournament_rules_enum AS ENUM (
    'wkf',              -- Всемирная Федерация Каратэ (Olympic Karate)
    'kyokushin',        -- Киокусинкай (полноконтактное каратэ)
    'olympic',          -- Олимпийский формат
    'jka'               -- Сётокан JKA (Себу Иппон)
);

CREATE TYPE tournament_status_enum AS ENUM (
    'draft',            -- Проект / подготовка
    'registration_open',-- Прием онлайн-заявок открыт
    'draw_completed',   -- Жеребьевка проведена, сетки готовы
    'in_progress',      -- Турнир идет
    'completed',        -- Турнир завершен, протоколы подписаны
    'archived'          -- В архиве
);

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'mixed');

CREATE TYPE belt_rank_enum AS ENUM (
    'white_10kyu',      -- Белый пояс
    'yellow_8kyu',     -- Желтый пояс
    'orange_7kyu',     -- Оранжевый пояс
    'green_6kyu',      -- Зеленый пояс
    'blue_4kyu',       -- Синий пояс
    'brown_3kyu',      -- Коричневый пояс (3 кю)
    'brown_1kyu',      -- Коричневый пояс (1 кю)
    'black_1dan',      -- Черный пояс 1 дан
    'black_2dan',      -- Черный пояс 2 дан
    'black_3dan_plus'  -- Черный пояс 3+ дан
);

CREATE TYPE participant_status_enum AS ENUM (
    'registered',       -- Заявлен тренером онлайн
    'weighed_in',       -- Прошел мандатную комиссию и взвешивание
    'draw_seeded',      -- Внесен в турнирную сетку
    'competing',        -- Активно участвует в боях
    'disqualified',     -- Дисквалифицирован (вес/нарушение)
    'withdrawn'         -- Снят врачом или тренером
);

CREATE TYPE discipline_enum AS ENUM (
    'kumite',           -- Индивидуальное кумитэ (поединки)
    'kata',             -- Индивидуальное ката (демонстрация форм)
    'team_kumite',      -- Командное кумитэ
    'team_kata'         -- Командное ката (с бункай)
);

CREATE TYPE bracket_type_enum AS ENUM (
    'olympic_with_repechage',     -- Олимпийская система с утешительными боями (WKF)
    'olympic_direct_elimination', -- Прямой вылет (Play-off)
    'round_robin'                 -- Круговая система (каждый с каждым)
);

CREATE TYPE tatami_status_enum AS ENUM (
    'ready',            -- Готово к открытию
    'active',           -- Идут поединки
    'paused',           -- Технический перерыв / перерыв на обед
    'finished'          -- Все бои на татами завершены
);

CREATE TYPE round_stage_enum AS ENUM (
    'round_1_32',       -- 1/32 финала
    'round_1_16',       -- 1/16 финала
    'round_1_8',        -- 1/8 финала
    'quarter_final',    -- 1/4 финала
    'semi_final',       -- Полуфинал
    'repechage',        -- Утешительный поединок за бронзу
    'bronze_match',     -- Поединок за 3-е место
    'final'             -- Финальный поединок за золото
);

CREATE TYPE bout_status_enum AS ENUM (
    'scheduled',            -- В расписании
    'waiting_competitors',  -- Вызов спортсменов на татами
    'in_progress',          -- Идет поединок (таймер запущен)
    'completed',            -- Поединок завершен, результат утвержден
    'cancelled'             -- Отменен
);

CREATE TYPE win_reason_enum AS ENUM (
    'points_lead',              -- Победа по баллам по истечении времени
    'senshu_advantage',         -- Преимущество Senshu при равном счете
    'hantei_decision',          -- Решение судей Хантей (при 0:0)
    'ippon_kyokushin',          -- Чистая победа нокаутом/нокдауном
    'hansoku_dq',               -- Дисквалификация соперника за грубое нарушение
    'kiken_injury'              -- Отказ соперника из-за травмы / Кикен
);

CREATE TYPE competitor_side_enum AS ENUM ('aka', 'ao');

CREATE TYPE bout_event_type_enum AS ENUM (
    'yuko_1',           -- Юко (+1 балл: удар рукой цуки в корпус или лицо)
    'waza_ari_2',       -- Ваза-ари (+2 балла: удар ногой тюдан гэри)
    'ippon_3',          -- Иппон (+3 балла: удар ногой дзёдан или бросок с добиванием)
    'senshu',           -- Первое безответное очко в поединке
    'c1_warning',       -- Нарушение кат. 1: чрезмерный контакт, опасные приемы
    'c2_warning',       -- Нарушение кат. 2: выход за татами дзёгай, уклонение
    'hansoku',          -- Дисквалификация за 4-е замечание или грубость
    'medical_call'      -- Вызов врача на татами (до 10 секунд)
);

CREATE TYPE referee_role_enum AS ENUM (
    'shushin',          -- Главный рефери на ковре (ведет бой)
    'fukushin_1',       -- Боковой судья 1 (с красным и синим флажками)
    'fukushin_2',       -- Боковой судья 2
    'fukushin_3',       -- Боковой судья 3
    'fukushin_4',       -- Боковой судья 4
    'kansa'             -- Арбитр / Супервайзер видеоповторов
);

CREATE TYPE placement_enum AS ENUM (
    '1st_gold',
    '2nd_silver',
    '3rd_bronze_1',
    '3rd_bronze_2',
    '5th',
    '7th',
    'participant'
);

-- ---------------------------------------------------------------------
-- 2. СТРУКТУРА ТАБЛИЦ: ОРГАНИЗАЦИИ, ПОЛЬЗОВАТЕЛИ И ТУРНИРЫ
-- ---------------------------------------------------------------------

-- Клубы / Додзё / Спортивные школы
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    head_coach_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30),
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Пользователи (Судьи, Операторы табло, Тренеры, Администраторы)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role user_role_enum NOT NULL DEFAULT 'club_coach',
    license_code VARCHAR(50),
    referee_category referee_category_enum,
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Турниры
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    rules_type tournament_rules_enum NOT NULL DEFAULT 'wkf',
    organization VARCHAR(200) NOT NULL,
    venue_name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Россия',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    status tournament_status_enum NOT NULL DEFAULT 'draft',
    image_url VARCHAR(500),
    chief_referee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_tournament_dates CHECK (end_date >= start_date)
);

-- ---------------------------------------------------------------------
-- 3. СТРУКТУРА КАТЕГОРИЙ (ВОЗРАСТНЫЕ И ВЕСОВЫЕ)
-- ---------------------------------------------------------------------

-- Возрастные категории (Дети 8-9, Кадеты 14-15, Юниоры 16-17, Взрослые 18+)
CREATE TABLE age_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    min_age SMALLINT NOT NULL CHECK (min_age >= 5),
    max_age SMALLINT,
    match_duration_seconds INTEGER NOT NULL DEFAULT 120, -- чистое время боя
    reference_rule VARCHAR(50) NOT NULL DEFAULT 'competition_day',
    CONSTRAINT check_age_span CHECK (max_age IS NULL OR max_age >= min_age)
);

-- Весовые категории (-67 кг, -75 кг, +84 кг, Абсолютная)
CREATE TABLE weight_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    age_category_id UUID NOT NULL REFERENCES age_categories(id) ON DELETE CASCADE,
    gender gender_enum NOT NULL,
    name VARCHAR(50) NOT NULL,
    min_weight_kg DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_weight_kg DECIMAL(5,2),
    is_open_weight BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT check_weight_span CHECK (max_weight_kg IS NULL OR max_weight_kg > min_weight_kg)
);

-- Татами (Соревновательные площадки)
CREATE TABLE tatamis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    number SMALLINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    location_zone VARCHAR(100) NOT NULL DEFAULT 'Главный зал',
    chief_judge_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scorekeeper_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status tatami_status_enum NOT NULL DEFAULT 'ready',
    CONSTRAINT unique_tatami_per_tournament UNIQUE (tournament_id, number)
);

-- Соревновательные категории турнира (Дивизионы)
CREATE TABLE tournament_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    age_category_id UUID NOT NULL REFERENCES age_categories(id) ON DELETE RESTRICT,
    weight_category_id UUID REFERENCES weight_categories(id) ON DELETE RESTRICT,
    discipline discipline_enum NOT NULL DEFAULT 'kumite',
    gender gender_enum NOT NULL,
    bracket_type bracket_type_enum NOT NULL DEFAULT 'olympic_with_repechage',
    assigned_tatami_id UUID REFERENCES tatamis(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    CONSTRAINT unique_tourn_category UNIQUE (tournament_id, age_category_id, weight_category_id, discipline, gender)
);

-- ---------------------------------------------------------------------
-- 4. УЧАСТНИКИ И ЖЕРЕБЬЕВКА
-- ---------------------------------------------------------------------

-- Спортсмены / Участники
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Россия',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender_enum NOT NULL,
    birth_date DATE NOT NULL,
    belt_rank belt_rank_enum NOT NULL,
    declared_weight_kg DECIMAL(5,2) NOT NULL,
    actual_weight_kg DECIMAL(5,2),
    is_weighed_in BOOLEAN NOT NULL DEFAULT false,
    is_medical_cleared BOOLEAN NOT NULL DEFAULT false,
    license_number VARCHAR(50) NOT NULL,
    status participant_status_enum NOT NULL DEFAULT 'registered',
    CONSTRAINT check_declared_weight CHECK (declared_weight_kg BETWEEN 15.0 AND 250.0),
    CONSTRAINT check_actual_weight CHECK (actual_weight_kg IS NULL OR actual_weight_kg BETWEEN 15.0 AND 250.0)
);

-- Заявки спортсменов в категории (сетка)
CREATE TABLE category_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    seed_number SMALLINT,
    final_placement placement_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_participant_per_category UNIQUE (category_id, participant_id)
);

-- ---------------------------------------------------------------------
-- 5. РАСПИСАНИЕ ПОЕДИНКОВ ПО ТАТАМИ И СУДЕЙСТВО
-- ---------------------------------------------------------------------

-- Поединки на татами
CREATE TABLE bouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,
    tatami_id UUID NOT NULL REFERENCES tatamis(id) ON DELETE RESTRICT,
    bout_number INTEGER NOT NULL,
    round_stage round_stage_enum NOT NULL,
    bracket_position INTEGER NOT NULL,
    aka_participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    ao_participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    aka_score SMALLINT NOT NULL DEFAULT 0,
    ao_score SMALLINT NOT NULL DEFAULT 0,
    aka_senshu BOOLEAN NOT NULL DEFAULT false,
    ao_senshu BOOLEAN NOT NULL DEFAULT false,
    aka_penalties_c1 SMALLINT NOT NULL DEFAULT 0,
    ao_penalties_c1 SMALLINT NOT NULL DEFAULT 0,
    aka_penalties_c2 SMALLINT NOT NULL DEFAULT 0,
    ao_penalties_c2 SMALLINT NOT NULL DEFAULT 0,
    winner_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    win_reason win_reason_enum,
    status bout_status_enum NOT NULL DEFAULT 'scheduled',
    timer_seconds_remaining INTEGER NOT NULL DEFAULT 120,
    CONSTRAINT check_scores_positive CHECK (aka_score >= 0 AND ao_score >= 0),
    CONSTRAINT check_single_senshu CHECK (NOT (aka_senshu AND ao_senshu))
);

-- Протокол событий поединка (начисление Юко, Ваза-ари, Иппон, замечания)
CREATE TABLE bout_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    match_second SMALLINT NOT NULL,
    competitor_side competitor_side_enum NOT NULL,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    event_type bout_event_type_enum NOT NULL,
    points SMALLINT NOT NULL DEFAULT 0,
    recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Судейские бригады на поединок
CREATE TABLE referee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    referee_role referee_role_enum NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_role_in_bout UNIQUE (bout_id, referee_role)
);

-- Аккредитация клубов на турниры (Раздельный учёт клубов и соревнований)
CREATE TABLE tournament_clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
    team_leader_name VARCHAR(150) NOT NULL,
    athletes_quota INTEGER NOT NULL DEFAULT 50,
    athletes_admitted_count INTEGER NOT NULL DEFAULT 0,
    accreditation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    fee_paid BOOLEAN NOT NULL DEFAULT false,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tourn_club UNIQUE (tournament_id, club_id)
);

-- Официальные судейские протоколы поединков (Верификация и подписи)
CREATE TABLE referee_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_number VARCHAR(50) NOT NULL UNIQUE,
    bout_id UUID NOT NULL UNIQUE REFERENCES bouts(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,
    discipline discipline_enum NOT NULL DEFAULT 'kumite',
    shushin_referee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    kansa_arbitrator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    score_summary VARCHAR(100) NOT NULL,
    winner_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    win_reason win_reason_enum NOT NULL,
    video_review_used BOOLEAN NOT NULL DEFAULT false,
    protest_filed BOOLEAN NOT NULL DEFAULT false,
    protest_status VARCHAR(50),
    is_certified BOOLEAN NOT NULL DEFAULT true,
    certified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Судейские протоколы оценивания Ката (WKF / SKIF 5-7 судей)
CREATE TABLE kata_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    kata_name VARCHAR(100) NOT NULL,
    judge_scores DECIMAL(3,1)[] NOT NULL,
    trimmed_min_score DECIMAL(3,1) NOT NULL,
    trimmed_max_score DECIMAL(3,1) NOT NULL,
    technical_score DECIMAL(4,2) NOT NULL,
    athletic_score DECIMAL(4,2) NOT NULL,
    final_score DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_kata_score_per_match UNIQUE (bout_id, participant_id),
    CONSTRAINT check_kata_score_range CHECK (final_score > 0.0 AND final_score <= 30.0)
);

-- ---------------------------------------------------------------------
-- 6. ПРОИЗВОДИТЕЛЬНЫЕ ИНДЕКСЫ ДЛЯ БЫСТРЫХ ВЫБОРОК РАСПИСАНИЯ
-- ---------------------------------------------------------------------

-- Индекс для мгновенного получения расписания на татами
CREATE INDEX idx_bouts_tatami_schedule 
    ON bouts (tatami_id, scheduled_time, bout_number);

-- Индекс по статусу поединков для монитора текущего боя
CREATE INDEX idx_bouts_tatami_status 
    ON bouts (tatami_id, status);

-- Индекс турнирной сетки
CREATE INDEX idx_bouts_category_bracket 
    ON bouts (category_id, round_stage, bracket_position);

-- Индекс для быстрого поиска боев конкретного спортсмена
CREATE INDEX idx_bouts_aka_fighter ON bouts (aka_participant_id);
CREATE INDEX idx_bouts_ao_fighter ON bouts (ao_participant_id);

-- Индекс поиска спортсменов клуба и турнира
CREATE INDEX idx_participants_tourn_club 
    ON participants (tournament_id, club_id, status);

-- Индекс контроля взвешивания
CREATE INDEX idx_participants_weigh_in 
    ON participants (tournament_id, is_weighed_in, is_medical_cleared);

-- ---------------------------------------------------------------------
-- 7. ТРИГГЕРЫ: АВТОМАТИЧЕСКАЯ ВАЛИДАЦИЯ И ОБНОВЛЕНИЕ TIMESTAMPS
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

export const REAL_WORLD_SQL_QUERIES = [
  {
    title: '1. Расписание поединков на Татами №1 с расчетом текущего и ожидающих боев',
    description: 'Извлекает поединки по татами с именами спортсменов (АКА в красном, АО в синем), клубами, категорией и статусом поединка.',
    sql: `SELECT 
    b.bout_number,
    b.round_stage,
    b.scheduled_time::time AS plan_time,
    b.status,
    ac.name AS age_category,
    wc.name AS weight_category,
    p_aka.last_name || ' ' || p_aka.first_name AS aka_fighter,
    c_aka.short_code AS aka_club,
    b.aka_score,
    p_ao.last_name || ' ' || p_ao.first_name AS ao_fighter,
    c_ao.short_code AS ao_club,
    b.ao_score,
    b.timer_seconds_remaining
FROM bouts b
JOIN tatamis t ON b.tatami_id = t.id
JOIN tournament_categories tc ON b.category_id = tc.id
JOIN age_categories ac ON tc.age_category_id = ac.id
LEFT JOIN weight_categories wc ON tc.weight_category_id = wc.id
LEFT JOIN participants p_aka ON b.aka_participant_id = p_aka.id
LEFT JOIN clubs c_aka ON p_aka.club_id = c_aka.id
LEFT JOIN participants p_ao ON b.ao_participant_id = p_ao.id
LEFT JOIN clubs c_ao ON p_ao.club_id = c_ao.id
WHERE t.number = 1 
  AND b.tournament_id = 'YOUR_TOURNAMENT_UUID'
ORDER BY b.scheduled_time ASC, b.bout_number ASC;`
  },
  {
    title: '2. Проверка соответствия фактического веса категории (Мандатная комиссия)',
    description: 'Контрольный запрос на взвешивании: находит спортсменов, чей фактический вес превышает границы заявленной весовой категории.',
    sql: `SELECT 
    p.id,
    p.last_name || ' ' || p.first_name AS athlete_name,
    c.name AS club_name,
    wc.name AS category_weight,
    wc.min_weight_kg,
    wc.max_weight_kg,
    p.actual_weight_kg,
    CASE 
        WHEN p.actual_weight_kg > wc.max_weight_kg THEN p.actual_weight_kg - wc.max_weight_kg 
        ELSE 0 
    END AS overweight_kg,
    p.is_medical_cleared,
    p.status
FROM participants p
JOIN category_entries ce ON p.id = ce.participant_id
JOIN tournament_categories tc ON ce.category_id = tc.id
JOIN weight_categories wc ON tc.weight_category_id = wc.id
JOIN clubs c ON p.club_id = c.id
WHERE p.is_weighed_in = true 
  AND (p.actual_weight_kg > wc.max_weight_kg OR p.actual_weight_kg < wc.min_weight_kg);`
  },
  {
    title: '3. Медальный зачет и командный рейтинг клубов по турниру',
    description: 'Агрегирует золотые, серебряные и бронзовые медали с начислением очков (Золото: 7, Серебро: 3, Бронза: 1).',
    sql: `SELECT 
    c.name AS club_name,
    c.city,
    COUNT(CASE WHEN ce.final_placement = '1st_gold' THEN 1 END) AS gold_medals,
    COUNT(CASE WHEN ce.final_placement = '2nd_silver' THEN 1 END) AS silver_medals,
    COUNT(CASE WHEN ce.final_placement IN ('3rd_bronze_1', '3rd_bronze_2') THEN 1 END) AS bronze_medals,
    (
        COUNT(CASE WHEN ce.final_placement = '1st_gold' THEN 1 END) * 7 +
        COUNT(CASE WHEN ce.final_placement = '2nd_silver' THEN 1 END) * 3 +
        COUNT(CASE WHEN ce.final_placement IN ('3rd_bronze_1', '3rd_bronze_2') THEN 1 END) * 1
    ) AS team_points
FROM clubs c
JOIN participants p ON c.id = p.club_id
JOIN category_entries ce ON p.id = ce.participant_id
JOIN tournament_categories tc ON ce.category_id = tc.id
WHERE tc.tournament_id = 'YOUR_TOURNAMENT_UUID'
GROUP BY c.id, c.name, c.city
ORDER BY gold_medals DESC, silver_medals DESC, bronze_medals DESC, team_points DESC;`
  },
  {
    title: '4. Детальный протокол боя с хронологией начисления баллов',
    description: 'Формирует официальный судейский протокол поединка со всеми баллами (Юко, Ваза-ари, Иппон) и предупреждениями Чуй.',
    sql: `SELECT 
    bs.match_second || ' сек' AS time_remaining,
    bs.competitor_side AS belt_side,
    p.last_name || ' ' || p.first_name AS athlete,
    bs.event_type,
    bs.points,
    u.full_name AS registered_by_referee,
    bs.created_at
FROM bout_scores bs
JOIN participants p ON bs.participant_id = p.id
LEFT JOIN users u ON bs.recorded_by_user_id = u.id
WHERE bs.bout_id = 'YOUR_BOUT_UUID'
ORDER BY bs.match_second DESC, bs.created_at ASC;`
  }
];
