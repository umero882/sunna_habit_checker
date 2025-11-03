-- Sunnah Habits Seed Data
-- Populates initial Sunnah habits with 3-tier benchmarks
-- Based on authentic Islamic sources
-- Created: 2025-11-01

-- ============= CATEGORIES =============

INSERT INTO sunnah_categories (name, name_ar, description, description_ar, icon, display_order) VALUES
('Prayer', 'الصلاة', 'Voluntary prayers and prayer-related practices', 'الصلوات النافلة والممارسات المتعلقة بالصلاة', '🕋', 1),
('Dhikr', 'الذكر', 'Remembrance of Allah through prescribed phrases', 'ذكر الله بالأذكار المأثورة', '📿', 2),
('Charity', 'الصدقة', 'Giving and acts of kindness', 'الإنفاق وأعمال الخير', '💰', 3),
('Quran', 'القرآن', 'Quran recitation and memorization', 'تلاوة القرآن وحفظه', '📖', 4),
('Fasting', 'الصيام', 'Voluntary fasting practices', 'الصيام التطوعي', '🌙', 5),
('Lifestyle', 'أسلوب الحياة', 'Daily habits and etiquettes', 'العادات اليومية والآداب', '✨', 6),
('Social', 'الاجتماعية', 'Community and family relations', 'العلاقات الأسرية والاجتماعية', '🤝', 7);

-- ============= PRAYER CATEGORY HABITS =============

INSERT INTO sunnah_habits (
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  source,
  source_ar,
  hadith_ref,
  tier_basic,
  tier_companion,
  tier_prophetic,
  tier_basic_ar,
  tier_companion_ar,
  tier_prophetic_ar,
  benefits,
  benefits_ar,
  icon,
  display_order,
  is_featured
) VALUES
-- 1. Duha Prayer
(
  (SELECT id FROM sunnah_categories WHERE name = 'Prayer'),
  'Duha Prayer (Forenoon Prayer)',
  'صلاة الضحى',
  'The Prophet ﷺ prayed Duha regularly. It is prayed after sunrise until just before Dhuhr, consisting of 2-8 rakʿāt.',
  'كان النبي ﷺ يصلي الضحى بانتظام. تصلى بعد شروق الشمس حتى قبل الظهر، من ركعتين إلى ثماني ركعات.',
  'Sahih Bukhari #1178',
  'صحيح البخاري ١١٧٨',
  'Narrated by Abu Huraira: My friend (the Prophet ﷺ) advised me to observe three things: (1) to fast three days a month; (2) to pray two rakʿāt of Duha prayer; and (3) to pray Witr before sleeping.',
  'Pray Duha 2 rakʿāt once a week',
  'Daily 2 rakʿāt',
  '4–8 rakʿāt daily, never missed',
  'صلِّ ركعتين من الضحى مرة في الأسبوع',
  'ركعتان يوميًا',
  '٤–٨ ركعات يوميًا، بلا انقطاع',
  ARRAY[
    'Counts as charity for every joint in the body (360 joints)',
    'Brings blessings and prosperity to your day',
    'Protects from being among the heedless',
    'Earns Allah''s satisfaction'
  ],
  ARRAY[
    'صدقة عن كل مفصل في الجسد (٣٦٠ مفصلًا)',
    'تجلب البركة والرزق لليوم',
    'تحمي من الغفلة',
    'تكسب رضا الله'
  ],
  '☀️',
  1,
  true
),

-- 2. Tahajjud (Night Prayer)
(
  (SELECT id FROM sunnah_categories WHERE name = 'Prayer'),
  'Tahajjud (Night Prayer)',
  'صلاة التهجد',
  'Prayer performed in the last third of the night. The Prophet ﷺ said it is the best prayer after the obligatory ones.',
  'الصلاة في الثلث الأخير من الليل. قال النبي ﷺ إنها أفضل الصلاة بعد الفريضة.',
  'Sahih Muslim #1163',
  'صحيح مسلم ١١٦٣',
  'The Prophet ﷺ said: "The best prayer after the obligatory prayers is the night prayer."',
  'Wake for Tahajjud once per week (2 rakʿāt minimum)',
  'Wake 3–4 nights/week for Tahajjud',
  'Daily Tahajjud, minimum 8 rakʿāt',
  'صلِّ التهجد مرة في الأسبوع (ركعتان كحد أدنى)',
  'صلِّ التهجد ٣–٤ ليالٍ في الأسبوع',
  'تهجد يومي، ٨ ركعات كحد أدنى',
  ARRAY[
    'Allah descends to the lowest heaven and responds to supplications',
    'Described as the time when du''a is most accepted',
    'Earns special closeness to Allah',
    'Wipes away sins and prevents wrongdoing'
  ],
  ARRAY[
    'ينزل الله إلى السماء الدنيا ويستجيب الدعاء',
    'وقت إجابة الدعاء المستجاب',
    'قرب خاص من الله',
    'تمحو الذنوب وتمنع من المعاصي'
  ],
  '🌙',
  2,
  true
),

-- 3. Sunnah Rawatib (Regular Sunnah Prayers)
(
  (SELECT id FROM sunnah_categories WHERE name = 'Prayer'),
  'Sunnah Rawatib',
  'السنن الرواتب',
  'Voluntary prayers associated with the five daily obligatory prayers. 12 rakʿāt daily as emphasized by the Prophet ﷺ.',
  'الصلوات النافلة المرتبطة بالصلوات الخمس المفروضة. ١٢ ركعة يوميًا كما أكد النبي ﷺ.',
  'Jami'' at-Tirmidhi #414',
  'جامع الترمذي ٤١٤',
  'The Prophet ﷺ said: "Whoever prays twelve rakʿāt in a day and night, a house will be built for him in Paradise."',
  'Pray at least 2 Sunnah (e.g., 2 before Fajr)',
  'Pray 6–10 Sunnah daily',
  'Never miss all 12 Sunnah Rawatib',
  'صلِّ ركعتين من السنة على الأقل (مثلاً: قبل الفجر)',
  'صلِّ ٦–١٠ ركعات من السنن يوميًا',
  'لا تفوت ١٢ ركعة من السنن الرواتب أبدًا',
  ARRAY[
    'A house in Paradise is built for those who pray 12 rakʿāt',
    'Completes and perfects the obligatory prayers',
    'Makes up for deficiencies in Fard prayers',
    'Increases closeness to Allah'
  ],
  ARRAY[
    'بيت في الجنة لمن صلى ١٢ ركعة',
    'تكمل وتتم الصلوات المفروضة',
    'تجبر النقص في الفرائض',
    'تزيد القرب من الله'
  ],
  '🕌',
  3,
  false
),

-- 4. Witr Prayer
(
  (SELECT id FROM sunnah_categories WHERE name = 'Prayer'),
  'Witr Prayer',
  'صلاة الوتر',
  'An odd-numbered prayer performed after Isha. The Prophet ﷺ never left it, whether traveling or at home.',
  'صلاة وترية تصلى بعد العشاء. لم يتركها النبي ﷺ أبدًا، سواء في السفر أو الحضر.',
  'Sahih Bukhari #998',
  'صحيح البخاري ٩٩٨',
  'The Prophet ﷺ said: "Allah is Witr (odd) and loves what is odd. So perform Witr prayer."',
  'Pray 1 rakʿah Witr occasionally',
  'Daily 3 rakʿāt Witr',
  'Daily 5+ rakʿāt Witr, including Qunūt du''a',
  'صلِّ ركعة وتر أحيانًا',
  'صلِّ ٣ ركعات وتر يوميًا',
  'صلِّ ٥+ ركعات وتر يوميًا مع دعاء القنوت',
  ARRAY[
    'Strongly emphasized Sunnah',
    'Last prayer of the night seals your worship',
    'Opportunity to make heartfelt du''a in Qunūt',
    'Shows commitment to following the Prophet''s practice'
  ],
  ARRAY[
    'سنة مؤكدة',
    'آخر صلاة في الليل تختم عبادتك',
    'فرصة للدعاء الخاشع في القنوت',
    'تظهر الالتزام باتباع سنة النبي'
  ],
  '🌟',
  4,
  false
);

-- ============= DHIKR CATEGORY HABITS =============

INSERT INTO sunnah_habits (
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  source,
  source_ar,
  hadith_ref,
  tier_basic,
  tier_companion,
  tier_prophetic,
  tier_basic_ar,
  tier_companion_ar,
  tier_prophetic_ar,
  benefits,
  benefits_ar,
  icon,
  display_order,
  is_featured
) VALUES
-- 5. Morning Adhkar
(
  (SELECT id FROM sunnah_categories WHERE name = 'Dhikr'),
  'Morning Adhkar',
  'أذكار الصباح',
  'Daily morning remembrances recited after Fajr until sunrise. Includes Ayat al-Kursi, last verses of Al-Baqarah, and various supplications.',
  'الأذكار الصباحية التي تقال بعد الفجر حتى شروق الشمس. تشمل آية الكرسي وآخر آيات البقرة وأدعية متنوعة.',
  'Sunan Abu Dawud #5077',
  'سنن أبي داود ٥٠٧٧',
  'The Prophet ﷺ used to say specific adhkar in the morning for protection and blessings.',
  'Recite basic morning adhkar (e.g., 3x Qul Hu Allahu Ahad)',
  'Complete essential morning adhkar list (10–15 min)',
  'Full morning adhkar with understanding and presence of heart',
  'اقرأ الأذكار الأساسية (مثلاً: ٣ مرات قل هو الله أحد)',
  'أكمل الأذكار الأساسية (١٠–١٥ دقيقة)',
  'الأذكار الكاملة مع الفهم وحضور القلب',
  ARRAY[
    'Protection from harm throughout the day',
    'Shield from Shaytan',
    'Barakah in time and provision',
    'Peace and tranquility of heart'
  ],
  ARRAY[
    'حماية من الأذى طوال اليوم',
    'درع من الشيطان',
    'بركة في الوقت والرزق',
    'سكينة وطمأنينة القلب'
  ],
  '🌅',
  1,
  true
),

-- 6. Evening Adhkar
(
  (SELECT id FROM sunnah_categories WHERE name = 'Dhikr'),
  'Evening Adhkar',
  'أذكار المساء',
  'Daily evening remembrances recited after Asr until Maghrib. Similar structure to morning adhkar with evening-specific supplications.',
  'الأذكار المسائية التي تقال بعد العصر حتى المغرب. بنية مماثلة للأذكار الصباحية مع أدعية خاصة بالمساء.',
  'Sunan Abu Dawud #5077',
  'سنن أبي داود ٥٠٧٧',
  'The Prophet ﷺ emphasized evening adhkar for protection during the night.',
  'Recite basic evening adhkar occasionally',
  'Daily essential evening adhkar (10 min)',
  'Complete evening adhkar with reflection',
  'اقرأ الأذكار الأساسية أحيانًا',
  'الأذكار الأساسية يوميًا (١٠ دقائق)',
  'الأذكار الكاملة مع التدبر',
  ARRAY[
    'Protection during the night',
    'Comfort and safety until morning',
    'Earns immense rewards',
    'Strengthens connection with Allah before sleep'
  ],
  ARRAY[
    'حماية خلال الليل',
    'الأمان والراحة حتى الصباح',
    'أجر عظيم',
    'تقوية الصلة بالله قبل النوم'
  ],
  '🌆',
  2,
  true
),

-- 7. Tasbih after Salah
(
  (SELECT id FROM sunnah_categories WHERE name = 'Dhikr'),
  'Tasbih After Salah',
  'التسبيح بعد الصلاة',
  'Saying SubhanAllah (33x), Alhamdulillah (33x), and Allahu Akbar (34x) after each obligatory prayer.',
  'قول سبحان الله (٣٣ مرة)، والحمد لله (٣٣ مرة)، والله أكبر (٣٤ مرة) بعد كل صلاة مفروضة.',
  'Sahih Muslim #597',
  'صحيح مسلم ٥٩٧',
  'The Prophet ﷺ said: "Whoever glorifies Allah (SubhanAllah) 33 times, praises Allah (Alhamdulillah) 33 times, and magnifies Allah (Allahu Akbar) 34 times after every prayer, his sins will be forgiven even if they are like the foam of the sea."',
  'Do Tasbih after 1–2 prayers daily',
  'After every Fard prayer (5x/day)',
  'After every prayer + add Ayat al-Kursi and other adhkar',
  'سبِّح بعد ١–٢ صلوات يوميًا',
  'بعد كل صلاة مفروضة (٥ مرات يوميًا)',
  'بعد كل صلاة + آية الكرسي وأذكار أخرى',
  ARRAY[
    'Sins forgiven even if like the foam of the sea',
    'Only takes 2–3 minutes',
    'Immediate spiritual reward',
    'Completes the prayer experience'
  ],
  ARRAY[
    'تُغفر الذنوب ولو كانت مثل زبد البحر',
    'تستغرق ٢–٣ دقائق فقط',
    'أجر روحي فوري',
    'تتم تجربة الصلاة'
  ],
  '📿',
  3,
  false
),

-- 8. Istighfar (Seeking Forgiveness)
(
  (SELECT id FROM sunnah_categories WHERE name = 'Dhikr'),
  'Istighfar - Seeking Forgiveness',
  'الاستغفار',
  'Regularly seeking Allah''s forgiveness. The Prophet ﷺ sought forgiveness more than 70 times a day.',
  'طلب مغفرة الله بانتظام. كان النبي ﷺ يستغفر أكثر من ٧٠ مرة في اليوم.',
  'Sahih Bukhari #6307',
  'صحيح البخاري ٦٣٠٧',
  'The Prophet ﷺ said: "By Allah! I ask for forgiveness from Allah and turn to Him in repentance more than seventy times a day."',
  'Say "Astaghfirullah" 10 times daily',
  'Say "Astaghfirullah" 70+ times daily',
  '100+ times daily with presence of heart and sincerity',
  'قل "أستغفر الله" ١٠ مرات يوميًا',
  'قل "أستغفر الله" ٧٠+ مرة يوميًا',
  '١٠٠+ مرة يوميًا مع حضور القلب والإخلاص',
  ARRAY[
    'Opens doors of provision and blessings',
    'Relieves anxiety and distress',
    'Brings rain and children (Quran 71:10-12)',
    'Wipes away sins continuously'
  ],
  ARRAY[
    'يفتح أبواب الرزق والبركات',
    'يزيل القلق والضيق',
    'يجلب المطر والذرية (سورة نوح ٧١:١٠-١٢)',
    'يمحو الذنوب باستمرار'
  ],
  '🤲',
  4,
  false
);

-- ============= CHARITY CATEGORY HABITS =============

INSERT INTO sunnah_habits (
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  source,
  source_ar,
  hadith_ref,
  tier_basic,
  tier_companion,
  tier_prophetic,
  tier_basic_ar,
  tier_companion_ar,
  tier_prophetic_ar,
  benefits,
  benefits_ar,
  icon,
  display_order,
  is_featured
) VALUES
-- 9. Daily Sadaqah
(
  (SELECT id FROM sunnah_categories WHERE name = 'Charity'),
  'Daily Sadaqah',
  'الصدقة اليومية',
  'Giving charity daily, even if small. Every good deed is charity, including a smile.',
  'التصدق يوميًا، ولو بالقليل. كل عمل صالح صدقة، حتى الابتسامة.',
  'Sahih Bukhari #6021',
  'صحيح البخاري ٦٠٢١',
  'The Prophet ﷺ said: "Every Muslim has to give in charity." The people asked, "O Allah''s Prophet! If someone has nothing to give, what should he do?" He said, "He should work with his hands and benefit himself and also give in charity." They asked, "If he cannot do even that?" He replied, "Then he should help the needy who appeal for help." They asked, "If he cannot do that?" He replied, "Then he should perform good deeds and keep away from evil deeds, and that will be regarded as charitable deeds."',
  'Give Sadaqah at least once a week',
  'Give Sadaqah 3–5 times per week',
  'Daily Sadaqah (financial or acts of kindness)',
  'تصدق مرة في الأسبوع على الأقل',
  'تصدق ٣–٥ مرات في الأسبوع',
  'صدقة يومية (مالية أو أعمال طيبة)',
  ARRAY[
    'Shields from calamity and hellfire',
    'Purifies wealth and soul',
    'Every joint requires daily charity - good deeds count',
    'Increases barakah in provision'
  ],
  ARRAY[
    'تحمي من البلاء والنار',
    'تطهر المال والنفس',
    'كل مفصل يحتاج صدقة يومية - الأعمال الصالحة تُحتسب',
    'تزيد البركة في الرزق'
  ],
  '💝',
  1,
  true
),

-- 10. Smiling and Kind Words
(
  (SELECT id FROM sunnah_categories WHERE name = 'Charity'),
  'Smiling & Kind Words',
  'الابتسامة والكلمة الطيبة',
  'The Prophet ﷺ said smiling at your brother is charity, and a good word is charity.',
  'قال النبي ﷺ إن الابتسامة في وجه أخيك صدقة، والكلمة الطيبة صدقة.',
  'Jami'' at-Tirmidhi #1956',
  'جامع الترمذي ١٩٥٦',
  'The Prophet ﷺ said: "Your smile for your brother is a charity. Your commanding the right and forbidding the wrong is a charity. Your guiding a man in the land of misguidance is a charity for you. Your seeing for a man with bad sight is a charity for you. Your removal of a rock, a thorn or a bone from the road is charity for you."',
  'Consciously smile at 1–2 people daily',
  'Greet people warmly, smile often',
  'Make it a constant habit; spread joy everywhere',
  'ابتسم بوعي لـ١–٢ شخص يوميًا',
  'حيِّ الناس بحرارة وابتسم كثيرًا',
  'اجعلها عادة دائمة؛ انشر السعادة في كل مكان',
  ARRAY[
    'Counted as charity without spending money',
    'Spreads positivity and strengthens bonds',
    'Following the Prophet''s cheerful character',
    'Earns continuous rewards'
  ],
  ARRAY[
    'تُحتسب صدقة بلا إنفاق مال',
    'تنشر الإيجابية وتقوي الروابط',
    'اتباع لخُلق النبي البشوش',
    'أجر مستمر'
  ],
  '😊',
  2,
  false
);

-- ============= QURAN CATEGORY HABITS =============

INSERT INTO sunnah_habits (
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  source,
  source_ar,
  hadith_ref,
  tier_basic,
  tier_companion,
  tier_prophetic,
  tier_basic_ar,
  tier_companion_ar,
  tier_prophetic_ar,
  benefits,
  benefits_ar,
  icon,
  display_order,
  is_featured
) VALUES
-- 11. Daily Quran Recitation
(
  (SELECT id FROM sunnah_categories WHERE name = 'Quran'),
  'Daily Quran Recitation',
  'تلاوة القرآن اليومية',
  'Reading the Quran daily. The Prophet ﷺ reviewed the Quran with Jibreel every Ramadan.',
  'قراءة القرآن يوميًا. كان النبي ﷺ يعرض القرآن على جبريل كل رمضان.',
  'Sahih Bukhari #5',
  'صحيح البخاري ٥',
  'The Prophet ﷺ said: "The best among you are those who learn the Quran and teach it."',
  'Read any amount of Quran 3–4 times/week',
  'Read at least 1 page daily',
  'Read 2+ pages daily or one juz'' per week',
  'اقرأ أي كمية من القرآن ٣–٤ مرات في الأسبوع',
  'اقرأ صفحة واحدة على الأقل يوميًا',
  'اقرأ ٢+ صفحات يوميًا أو جزء في الأسبوع',
  ARRAY[
    'Every letter earns 10 rewards',
    'Quran will intercede for you on Judgment Day',
    'Brings tranquility and angels surround you',
    'Raises your status in Paradise'
  ],
  ARRAY[
    'كل حرف بعشر حسنات',
    'القرآن يشفع لك يوم القيامة',
    'يجلب السكينة والملائكة تحفك',
    'يرفع درجتك في الجنة'
  ],
  '📗',
  1,
  true
),

-- 12. Surah Al-Kahf on Friday
(
  (SELECT id FROM sunnah_categories WHERE name = 'Quran'),
  'Surah Al-Kahf on Friday',
  'سورة الكهف يوم الجمعة',
  'Reading Surah Al-Kahf every Friday brings light between the two Fridays.',
  'قراءة سورة الكهف كل جمعة تجلب نورًا بين الجمعتين.',
  'Sunan Abu Dawud #1046',
  'سنن أبي داود ١٠٤٦',
  'The Prophet ﷺ said: "Whoever reads Surah Al-Kahf on Friday, it will illuminate him with light from one Friday to the next."',
  'Read Surah Al-Kahf occasionally on Friday',
  'Read Surah Al-Kahf most Fridays',
  'Never miss Surah Al-Kahf on Friday',
  'اقرأ سورة الكهف أحيانًا يوم الجمعة',
  'اقرأ سورة الكهف معظم أيام الجمعة',
  'لا تفوت سورة الكهف يوم الجمعة أبدًا',
  ARRAY[
    'Light illuminates you from Friday to Friday',
    'Protection from Dajjal (first and last 10 verses)',
    'Special blessings on the blessed day',
    'Strengthens faith and understanding'
  ],
  ARRAY[
    'نور يضيء لك من جمعة إلى جمعة',
    'حماية من الدجال (أول وآخر ١٠ آيات)',
    'بركات خاصة في اليوم المبارك',
    'تقوي الإيمان والفهم'
  ],
  '📘',
  2,
  false
);

-- ============= FASTING CATEGORY HABITS =============

INSERT INTO sunnah_habits (
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  source,
  source_ar,
  hadith_ref,
  tier_basic,
  tier_companion,
  tier_prophetic,
  tier_basic_ar,
  tier_companion_ar,
  tier_prophetic_ar,
  benefits,
  benefits_ar,
  icon,
  display_order,
  is_featured
) VALUES
-- 13. Monday & Thursday Fasting
(
  (SELECT id FROM sunnah_categories WHERE name = 'Fasting'),
  'Monday & Thursday Fasting',
  'صيام الاثنين والخميس',
  'The Prophet ﷺ used to fast Mondays and Thursdays regularly.',
  'كان النبي ﷺ يصوم الاثنين والخميس بانتظام.',
  'Jami'' at-Tirmidhi #747',
  'جامع الترمذي ٧٤٧',
  'The Prophet ﷺ said: "Deeds are presented on Mondays and Thursdays, and I love that my deeds be presented while I am fasting."',
  'Fast one of these days occasionally',
  'Fast Mondays OR Thursdays regularly',
  'Fast both days every week',
  'صم أحد هذين اليومين أحيانًا',
  'صم الاثنين أو الخميس بانتظام',
  'صم كلا اليومين كل أسبوع',
  ARRAY[
    'Deeds are presented to Allah on these days',
    'Consistent Prophetic practice',
    'Spiritual discipline and self-control',
    'Immense reward for voluntary fasting'
  ],
  ARRAY[
    'تُعرض الأعمال على الله في هذين اليومين',
    'سنة نبوية ثابتة',
    'انضباط روحي وتحكم بالنفس',
    'أجر عظيم للصيام التطوعي'
  ],
  '🌙',
  1,
  true
),

-- 14. White Days Fasting (13, 14, 15)
(
  (SELECT id FROM sunnah_categories WHERE name = 'Fasting'),
  'White Days Fasting',
  'صيام الأيام البيض',
  'Fasting the 13th, 14th, and 15th of each lunar month. The Prophet ﷺ encouraged this practice.',
  'صيام الـ١٣ والـ١٤ والـ١٥ من كل شهر قمري. شجع النبي ﷺ على هذه الممارسة.',
  'Sunan an-Nasa''i #2424',
  'سنن النسائي ٢٤٢٤',
  'The Prophet ﷺ said: "If you fast any part of the month then fast the thirteenth, fourteenth and fifteenth."',
  'Fast the White Days occasionally',
  'Fast the White Days most months',
  'Never miss the White Days',
  'صم الأيام البيض أحيانًا',
  'صم الأيام البيض معظم الأشهر',
  'لا تفوت الأيام البيض أبدًا',
  ARRAY[
    'Equivalent to fasting the whole month',
    'Full moon nights have special blessings',
    'Following the Prophet''s recommendation',
    'Easy to track on lunar calendar'
  ],
  ARRAY[
    'معادل لصيام الشهر كله',
    'ليالي البدر لها بركات خاصة',
    'اتباع توصية النبي',
    'سهل التتبع في التقويم القمري'
  ],
  '🌕',
  2,
  false
);

-- ============= LIFESTYLE CATEGORY HABITS =============

INSERT INTO sunnah_habits (
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  source,
  source_ar,
  hadith_ref,
  tier_basic,
  tier_companion,
  tier_prophetic,
  tier_basic_ar,
  tier_companion_ar,
  tier_prophetic_ar,
  benefits,
  benefits_ar,
  icon,
  display_order,
  is_featured
) VALUES
-- 15. Siwak (Miswak)
(
  (SELECT id FROM sunnah_categories WHERE name = 'Lifestyle'),
  'Using Siwak (Miswak)',
  'استخدام السواك',
  'The Prophet ﷺ emphasized using siwak before prayer and when waking up.',
  'أكد النبي ﷺ على استخدام السواك قبل الصلاة وعند الاستيقاظ.',
  'Sahih Bukhari #887',
  'صحيح البخاري ٨٨٧',
  'The Prophet ﷺ said: "If I had not found it hard for my followers, I would have ordered them to use the siwak with every prayer."',
  'Use siwak occasionally',
  'Use siwak before 2–3 prayers daily',
  'Use siwak before every prayer and when waking',
  'استخدم السواك أحيانًا',
  'استخدم السواك قبل ٢–٣ صلوات يوميًا',
  'استخدم السواك قبل كل صلاة وعند الاستيقاظ',
  ARRAY[
    'Purifies the mouth and pleases Allah',
    'Health benefits for teeth and gums',
    'Revives a forgotten Sunnah',
    'Enhances the spiritual state for prayer'
  ],
  ARRAY[
    'يطهر الفم ويرضي الله',
    'فوائد صحية للأسنان واللثة',
    'يحيي سنة منسية',
    'يعزز الحالة الروحية للصلاة'
  ],
  '🪥',
  1,
  false
),

-- 16. Eating with Right Hand
(
  (SELECT id FROM sunnah_categories WHERE name = 'Lifestyle'),
  'Eating with Right Hand',
  'الأكل باليد اليمنى',
  'The Prophet ﷺ ate with his right hand and commanded us to do the same.',
  'كان النبي ﷺ يأكل بيده اليمنى وأمرنا بذلك.',
  'Sahih Muslim #2020',
  'صحيح مسلم ٢٠٢٠',
  'The Prophet ﷺ said: "When any one of you eats, let him eat with his right hand, and when he drinks, let him drink with his right hand, for the Shaytan eats with his left hand and drinks with his left hand."',
  'Consciously eat with right hand occasionally',
  'Always eat with right hand',
  'Eat with right hand + say Bismillah + other eating etiquettes',
  'تعمد الأكل باليد اليمنى أحيانًا',
  'تناول الطعام دائمًا باليد اليمنى',
  'الأكل باليمنى + البسملة + آداب الطعام الأخرى',
  ARRAY[
    'Opposite of Shaytan''s practice',
    'Simple Sunnah to revive daily',
    'Mindfulness in everyday actions',
    'Complete eating etiquettes bring blessings'
  ],
  ARRAY[
    'عكس فعل الشيطان',
    'سنة بسيطة تحييها يوميًا',
    'الوعي في الأفعال اليومية',
    'آداب الطعام الكاملة تجلب البركة'
  ],
  '🍽️',
  2,
  false
),

-- 17. Sleeping on Right Side
(
  (SELECT id FROM sunnah_categories WHERE name = 'Lifestyle'),
  'Sleeping on Right Side',
  'النوم على الجانب الأيمن',
  'The Prophet ﷺ would lie on his right side and place his hand under his cheek.',
  'كان النبي ﷺ يضطجع على جانبه الأيمن ويضع يده تحت خده.',
  'Sahih Bukhari #247',
  'صحيح البخاري ٢٤٧',
  'The Prophet ﷺ said: "When you go to bed, perform ablution as for prayer, then lie down on your right side."',
  'Sleep on right side sometimes',
  'Usually sleep on right side',
  'Always sleep on right side + bedtime adhkar + wudu',
  'نم على الجانب الأيمن أحيانًا',
  'نم عادة على الجانب الأيمن',
  'نم دائمًا على الأيمن + أذكار النوم + الوضوء',
  ARRAY[
    'Following the Prophet''s sleeping habit',
    'Health benefits (better for heart)',
    'Dying in this state means dying on Sunnah',
    'Complete bedtime routine brings protection'
  ],
  ARRAY[
    'اتباع عادة النبي في النوم',
    'فوائد صحية (أفضل للقلب)',
    'الموت على هذه الحال يعني الموت على السنة',
    'روتين النوم الكامل يجلب الحماية'
  ],
  '🛏️',
  3,
  false
);

-- ============= SOCIAL CATEGORY HABITS =============

INSERT INTO sunnah_habits (
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  source,
  source_ar,
  hadith_ref,
  tier_basic,
  tier_companion,
  tier_prophetic,
  tier_basic_ar,
  tier_companion_ar,
  tier_prophetic_ar,
  benefits,
  benefits_ar,
  icon,
  display_order,
  is_featured
) VALUES
-- 18. Visiting the Sick
(
  (SELECT id FROM sunnah_categories WHERE name = 'Social'),
  'Visiting the Sick',
  'عيادة المريض',
  'The Prophet ﷺ emphasized visiting the sick as a right of a Muslim.',
  'أكد النبي ﷺ على عيادة المريض كحق للمسلم.',
  'Sahih Bukhari #5649',
  'صحيح البخاري ٥٦٤٩',
  'The Prophet ﷺ said: "There are five things that a Muslim owes to his brother: returning greetings, visiting the sick, attending funerals, accepting invitations, and saying ''Yarhamuk Allah'' when he sneezes."',
  'Visit sick relatives/friends occasionally',
  'Visit sick people regularly when aware',
  'Actively seek opportunities to visit the sick',
  'زر المرضى من الأقارب/الأصدقاء أحيانًا',
  'زر المرضى بانتظام عند العلم',
  'ابحث بنشاط عن فرص لزيارة المرضى',
  ARRAY[
    '70,000 angels pray for you until evening/morning',
    'Earns harvest from Paradise',
    'Shows compassion and builds community',
    'Fulfills a right of your Muslim brother'
  ],
  ARRAY[
    '٧٠,٠٠٠ ملك يصلون عليك حتى المساء/الصباح',
    'تكسب حصادًا من الجنة',
    'تظهر الرحمة وتبني المجتمع',
    'تفي بحق أخيك المسلم'
  ],
  '🏥',
  1,
  false
),

-- 19. Greeting with Salam
(
  (SELECT id FROM sunnah_categories WHERE name = 'Social'),
  'Spreading Salam',
  'إفشاء السلام',
  'The Prophet ﷺ said spreading salam is one of the best deeds in Islam.',
  'قال النبي ﷺ إن إفشاء السلام من أفضل الأعمال في الإسلام.',
  'Sahih Muslim #54',
  'صحيح مسلم ٥٤',
  'The Prophet ﷺ said: "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I not tell you of something that, if you do it, you will love one another? Spread salam amongst yourselves."',
  'Say Salam to people you know',
  'Say Salam to Muslims you don''t know',
  'Initiate Salam everywhere, even to strangers',
  'سلّم على من تعرف',
  'سلّم على المسلمين الذين لا تعرفهم',
  'ابدأ بالسلام في كل مكان، حتى على الغرباء',
  ARRAY[
    'Spreads love and peace',
    'Entry to Paradise requires loving one another',
    '30 rewards for full greeting',
    'Breaks down barriers and builds unity'
  ],
  ARRAY[
    'ينشر المحبة والسلام',
    'دخول الجنة يتطلب المحبة بين المؤمنين',
    '٣٠ حسنة للسلام الكامل',
    'يكسر الحواجز ويبني الوحدة'
  ],
  '👋',
  2,
  false
),

-- 20. Maintaining Family Ties
(
  (SELECT id FROM sunnah_categories WHERE name = 'Social'),
  'Maintaining Family Ties (Silat al-Rahm)',
  'صلة الرحم',
  'Maintaining family ties increases lifespan and provision.',
  'صلة الرحم تزيد العمر والرزق.',
  'Sahih Bukhari #5986',
  'صحيح البخاري ٥٩٨٦',
  'The Prophet ﷺ said: "Whoever wishes to have his provision expanded and his lifespan extended, let him maintain the ties of kinship."',
  'Contact family members occasionally',
  'Regular contact with close family',
  'Proactive in maintaining all family ties',
  'تواصل مع أفراد العائلة أحيانًا',
  'تواصل منتظم مع العائلة المقربة',
  'نشيط في صلة جميع الأرحام',
  ARRAY[
    'Increases lifespan and provision',
    'Beloved to Allah',
    'Prevents family disputes',
    'Creates strong support system'
  ],
  ARRAY[
    'يزيد العمر والرزق',
    'محبوب عند الله',
    'يمنع النزاعات العائلية',
    'يخلق نظام دعم قوي'
  ],
  '👨‍👩‍👧‍👦',
  3,
  true
);

-- ============= COMMENTS =============

COMMENT ON TABLE sunnah_categories IS 'Seed data: 7 categories for organizing Sunnah habits';
COMMENT ON TABLE sunnah_habits IS 'Seed data: 20 initial Sunnah habits across all categories with authentic sources';
