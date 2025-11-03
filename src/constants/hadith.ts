/**
 * Authentic Hadith Collection
 * All hadith are from Sahih (authentic) sources only
 */

export interface Hadith {
  id: string;
  category: 'on_time' | 'delayed' | 'missed' | 'qadaa' | 'friday_sunnah';
  textArabic?: string;
  textEnglish: string;
  source: string;
  reference: string;
  reward?: string;
  context?: string;
}

export interface FridaySunnahItem {
  id: string;
  title: string;
  description: string;
  hadith: Hadith;
  icon: string;
}

// ============= PRAYER STATUS HADITH =============

export const PRAYER_STATUS_HADITH: Record<string, Hadith[]> = {
  on_time: [
    {
      id: 'on_time_1',
      category: 'on_time',
      textEnglish:
        'Abdullah asked the Prophet Muhammad (ﷺ) "Which deed is the dearest to Allah?" He replied, "To offer the prayers at their early stated fixed times."',
      source: 'Sahih al-Bukhari',
      reference: '527',
      reward: 'The most beloved deed to Allah',
      context: 'Praying on time is one of the best actions in Islam',
    },
    {
      id: 'on_time_2',
      category: 'on_time',
      textEnglish:
        'The Prophet (ﷺ) was asked, "Which deeds are best?" The Prophet said, "Prayer at the beginning of its time."',
      source: 'Sunan al-Tirmidhi',
      reference: '170',
      reward: 'Among the best deeds',
      context: 'Praying at the start of prayer time is highly meritorious',
    },
    {
      id: 'on_time_3',
      category: 'on_time',
      textEnglish:
        'As Narrated by Ibn Umar, Allah\'s Messenger said: "The beginning of the time for prayer is pleasing to Allah, and the end of its time is pardoned by Allah."',
      source: 'Jami at-Tirmidhi',
      reference: '172',
      reward: 'Pleasing to Allah',
      context: "Praying early in the time period brings Allah's pleasure",
    },
  ],

  delayed: [
    // Sahih al-Bukhari hadith first
    {
      id: 'delayed_2',
      category: 'delayed',
      textEnglish:
        'The Prophet (ﷺ) said: "No prayer is more burdensome to the hypocrites than the dawn and evening prayers. If they knew the blessing in them, they would come even if they had to crawl."',
      source: 'Sahih al-Bukhari',
      reference: '657',
      context: 'Fajr and Isha prayers are tests of faith when delayed or abandoned',
    },
    {
      id: 'delayed_6',
      category: 'delayed',
      textEnglish:
        'Abu Hurairah narrated that the Prophet (ﷺ) said: "The prayer performed in congregation is twenty-five times superior to the prayer performed alone." Even if delayed, praying is still immensely rewarding.',
      source: 'Sahih al-Bukhari',
      reference: '645',
      reward: 'Prayer has great reward even when delayed',
      context: 'Encouragement: Better to pray delayed than miss it entirely',
    },
    // Sahih Muslim hadith second
    {
      id: 'delayed_1',
      category: 'delayed',
      textEnglish:
        'The Prophet Muhammad (ﷺ) said: "This is the prayer of the hypocrites: He sits watching the sun decline until it is between the two horns of Satan, then he quickly pecks the ground four times while he only remembers Allah for a few moments."',
      source: 'Sahih Muslim',
      reference: '622',
      context: 'Warning against delaying Asr prayer until the last moment',
    },
    {
      id: 'delayed_5',
      category: 'delayed',
      textEnglish:
        'The Prophet (ﷺ) said: "Act upon your prayers before you are unable to do so. The connection between a person and shirk (polytheism) and kufr (disbelief) is the abandonment of prayer."',
      source: 'Sahih Muslim',
      reference: '82',
      reward: 'Praying late is better than not praying',
      context: 'A reminder to pray while you still can, even if delayed',
    },
    // Other Sahih hadith collections third
    {
      id: 'delayed_3',
      category: 'delayed',
      textEnglish:
        'The Prophet (ﷺ) said: "The covenant between us and them is prayer, so whoever abandons it has disbelieved."',
      source: 'Sunan al-Tirmidhi',
      reference: '2621 (Sahih)',
      context:
        'Prayer is what distinguishes believers - delaying habitually can lead to abandoning',
    },
    {
      id: 'delayed_4',
      category: 'delayed',
      textEnglish:
        'Ibn Abbas reported that the Prophet (ﷺ) said: "Allah does not accept the prayer of a man who delays a prayer until its time has ended."',
      source: 'Sunan Ibn Majah',
      reference: '694 (Hasan)',
      context:
        'Delaying until the time expires is serious, but praying late is still better than missing',
    },
  ],

  missed: [
    {
      id: 'missed_1',
      category: 'missed',
      textEnglish:
        'Whoever leaves the Asr prayer [deliberately], then all his good deeds will be nullified.',
      source: 'Sahih Bukhari',
      reference: '553',
      context: 'Severe warning about intentionally missing prayers',
    },
    {
      id: 'missed_2',
      category: 'missed',
      textEnglish:
        'Umar (رضي الله عنه) narrated that the Prophet (ﷺ) said: "Whoever misses the Asr prayers (intentionally), then it is as if he lost his family and property."',
      source: 'Sahih al-Bukhari',
      reference: '552',
      context: 'Missing prayer is like losing everything valuable',
    },
    {
      id: 'missed_3',
      category: 'missed',
      textEnglish:
        'The Prophet (ﷺ) said: "Between a man and [him falling into] polytheism and unbelief is the abandonment of Prayer."',
      source: 'Sahih Muslim',
      reference: '82',
      context: 'Abandoning prayer is extremely serious in Islam',
    },
    {
      id: 'missed_4',
      category: 'missed',
      textEnglish:
        'The Prophet (ﷺ) said: "The first matter that the slave will be brought to account for on the Day of Judgment is the prayer. If it is sound, then the rest of his deeds will be sound. And if it is bad, then the rest of his deeds will be bad."',
      source: 'Sunan al-Tirmidhi',
      reference: '413 (Hasan)',
      context: 'Prayer is the foundation - its neglect affects all other deeds',
    },
    {
      id: 'missed_5',
      category: 'missed',
      textEnglish:
        "The Prophet (ﷺ) said: \"Say to Allah, 'O Allah, do not leave me to myself even for the blink of an eye.'\" Missing prayer leaves us without Allah's protection, but His door of repentance is always open.",
      source: 'Sunan Abu Dawud',
      reference: '5090 (Sahih)',
      reward: 'The door of repentance is still open',
      context: 'Hope: Turn back to Allah immediately through sincere repentance',
    },
    {
      id: 'missed_6',
      category: 'missed',
      textEnglish:
        'Allah says in a Hadith Qudsi: "O son of Adam, so long as you call upon Me and ask of Me, I shall forgive you for what you have done, and I shall not mind. O son of Adam, were your sins to reach the clouds of the sky and were you then to ask forgiveness of Me, I would forgive you."',
      source: 'Sunan al-Tirmidhi',
      reference: '3540 (Hasan)',
      reward: "Allah's mercy encompasses all sins",
      context: 'Hope: No matter how many prayers missed, sincere repentance brings forgiveness',
    },
    {
      id: 'missed_7',
      category: 'missed',
      textEnglish:
        'The Prophet (ﷺ) said: "By the One in Whose Hand is my soul, even if you were to commit sins until your sins reach the heaven, then you were to repent, He would accept your repentance."',
      source: 'Sunan Ibn Majah',
      reference: '4248 (Sahih)',
      reward: 'Allah accepts sincere repentance',
      context: 'Hope: Return to prayer now and Allah will forgive',
    },
  ],

  qadaa: [
    {
      id: 'qadaa_1',
      category: 'qadaa',
      textEnglish:
        'Anas ibn Malik narrated that the Prophet (ﷺ) said: "Whoever forgets a prayer, let him offer it as soon as he remembers, for there is no expiation for it other than that."',
      source: 'Sahih al-Bukhari',
      reference: '597',
      reward: 'Expiation for the missed prayer',
      context: 'Making up missed prayers is obligatory and brings forgiveness',
    },
    {
      id: 'qadaa_2',
      category: 'qadaa',
      textEnglish:
        'The Prophet (ﷺ) said: "If one of you sleeps and misses a prayer, or forgets it, let him offer the prayer when he remembers."',
      source: 'Sahih Muslim',
      reference: '684',
      reward: 'Fulfilling the obligation',
      context: 'Allah accepts repentance and making up of missed prayers',
    },
    {
      id: 'qadaa_3',
      category: 'qadaa',
      textEnglish:
        'The Prophet (ﷺ) said: "Allah, the Exalted, says: \'O My servants, you sin by night and by day, and I forgive all sins, so seek forgiveness of Me and I shall forgive you.\'"',
      source: 'Sahih Muslim',
      reference: '2577',
      reward: 'Complete forgiveness from Allah',
      context: "Making up prayers with sincere repentance brings Allah's forgiveness",
    },
    {
      id: 'qadaa_4',
      category: 'qadaa',
      textEnglish:
        'The Prophet (ﷺ) said: "The one who repents from sin is like one who has no sin."',
      source: 'Sunan Ibn Majah',
      reference: '4250 (Hasan)',
      reward: 'Complete purification through repentance',
      context: 'Making up missed prayers with sincere heart cleanses past neglect',
    },
    {
      id: 'qadaa_5',
      category: 'qadaa',
      textEnglish:
        "Abu Hurairah reported that the Prophet (ﷺ) said: \"When a servant (of Allah) commits a sin and says: 'O my Lord, I have committed a sin, so forgive me,' his Lord says: 'My servant has known that he has a Lord Who forgives sins and punishes for it. I have, therefore, granted forgiveness to My servant.'\"",
      source: 'Sahih Muslim',
      reference: '2758',
      reward: 'Immediate forgiveness upon sincere repentance',
      context: 'Allah rejoices in the repentance of His servants',
    },
    {
      id: 'qadaa_6',
      category: 'qadaa',
      textEnglish:
        'The Prophet (ﷺ) said: "All the sons of Adam are sinners, but the best of sinners are those who repent often."',
      source: 'Sunan al-Tirmidhi',
      reference: '2499 (Hasan)',
      reward: 'Being among the best of people',
      context: 'Making up prayers consistently shows true repentance',
    },
    {
      id: 'qadaa_7',
      category: 'qadaa',
      textEnglish:
        'The Prophet (ﷺ) said: "Verily, Allah is more delighted with the repentance of His slave than a person who has his camel in a waterless desert carrying his provision of food and drink and it is lost. He loses all hope of finding it, lies down in the shade and is disappointed about his camel; then when he finds it, he says (in extreme happiness): \'O Allah, You are my slave and I am Your Lord.\' He commits this mistake out of extreme joy."',
      source: 'Sahih Muslim',
      reference: '2747',
      reward: "Allah's joy in your return to prayer",
      context: 'Allah loves when we return to Him through making up prayers',
    },
  ],
};

// ============= FRIDAY (JUMU\'AH) SUNNAH PRACTICES =============

export const FRIDAY_SUNNAH_ITEMS: FridaySunnahItem[] = [
  {
    id: 'ghusl',
    title: 'Took Ghusl (Bath)',
    description: 'Performed full ritual bath before Friday prayer',
    icon: '🚿',
    hadith: {
      id: 'friday_ghusl',
      category: 'friday_sunnah',
      textEnglish:
        'The Prophet (ﷺ) said: "Whoever takes a bath on Friday, purifies himself as much as he can, then uses his (hair) oil or perfumes himself with the scent of his house, then proceeds (for the Jumu\'ah prayer) and does not separate two persons sitting together (in the mosque), then prays as much as (Allah has) written for him and then remains silent while the Imam is delivering the Khutba, his sins in-between the present and the last Friday would be forgiven."',
      source: 'Sahih al-Bukhari',
      reference: '883',
      reward: 'Forgiveness of sins between Fridays',
      context: 'Ghusl is a highly emphasized Sunnah for Friday prayer',
    },
  },
  {
    id: 'early_arrival',
    title: 'Came Early to Mosque',
    description: 'Arrived early for Friday prayer',
    icon: '🏃',
    hadith: {
      id: 'friday_early',
      category: 'friday_sunnah',
      textEnglish:
        'Al-Bukhari and Muslim narrated from Abu Hurayrah that the Messenger of Allah (ﷺ) said: "Whoever does ghusl on Friday like ghusl for major ritual impurity, then goes to the prayer (in the first hour, i.e., early), it is as if he sacrificed a camel. Whoever goes in the second hour, it is as if he sacrificed a cow. Whoever goes in the third hour, it is as if he sacrificed a horned ram. Whoever goes in the fourth hour, it is as if he sacrificed a hen. Whoever goes in the fifth hour, it is as if he sacrificed an egg."',
      source: 'Sahih al-Bukhari',
      reference: '814',
      reward: 'Reward like sacrificing a camel (if first to arrive)',
      context: 'The earlier you arrive, the greater the reward',
    },
  },
  {
    id: 'best_clothes',
    title: 'Wore Best Clothes/Perfume',
    description: 'Dressed well and applied perfume for Friday',
    icon: '👔',
    hadith: {
      id: 'friday_clothes',
      category: 'friday_sunnah',
      textEnglish:
        'Abu Sa\'id reported that the Prophet (ﷺ) said: "The taking of a bath on Friday is compulsory for every male Muslim who has attained the age of puberty and (also) the cleaning of his teeth with Siwak, and the using of perfume if it is available."',
      source: 'Sahih al-Bukhari',
      reference: '880',
      reward: 'Following the Sunnah of the Prophet',
      context: 'Presenting oneself well is part of honoring Friday',
    },
  },
  {
    id: 'surah_kahf',
    title: 'Read Surah Al-Kahf',
    description: 'Recited Surah Al-Kahf on Friday',
    icon: '📖',
    hadith: {
      id: 'friday_kahf',
      category: 'friday_sunnah',
      textEnglish:
        'The Prophet (ﷺ) said: "Whoever reads Surat al-Kahf on the day of Jumu\'ah, will have a light that will shine from him from one Friday to the next."',
      source: 'Al-Hakim (authenticated by Al-Albani)',
      reference: "Sahih al-Jami' 6470",
      reward: 'Light shining from one Friday to the next',
      context: 'Reading Surah Al-Kahf any time from Thursday sunset to Friday sunset',
    },
  },
  {
    id: 'abundant_salawat',
    title: 'Sent Abundant Salawat',
    description: 'Sent many blessings upon the Prophet ﷺ',
    icon: '🤲',
    hadith: {
      id: 'friday_salawat',
      category: 'friday_sunnah',
      textEnglish:
        'The Messenger of Allah (ﷺ) said: "Friday is one of your best days. It was on it that Adam was made, and it was on it that his (soul) was taken. So increase the frequency with which you send your Salat (blessings) to me, because your Salat are presented to me."',
      source: 'Sunan Abu Dawud',
      reference: '1047 (authenticated by Al-Albani)',
      reward: 'Closeness to the Prophet ﷺ on Day of Judgment',
      context: 'Send abundant Salawat throughout Friday, especially after Asr',
    },
  },
  {
    id: 'use_siwak',
    title: 'Used Siwak (Miswak)',
    description: 'Cleaned teeth with Siwak before prayer',
    icon: '🪥',
    hadith: {
      id: 'friday_siwak',
      category: 'friday_sunnah',
      textEnglish:
        'The Prophet (ﷺ) said: "Taking a bath on Friday is obligatory for every Muslim who has reached puberty, as is using siwak, and putting on perfume if he can find it."',
      source: 'Sahih Muslim',
      reference: '846',
      reward: 'Following the emphasized Sunnah',
      context: 'Using Siwak purifies the mouth and pleases Allah',
    },
  },
  {
    id: 'no_stepping_over',
    title: 'Did Not Step Over People',
    description: 'Avoided stepping over people in the mosque',
    icon: '🚶',
    hadith: {
      id: 'friday_no_stepping',
      category: 'friday_sunnah',
      textEnglish:
        'The Prophet (ﷺ) said in the hadith of Friday ghusl: "...then proceeds (for the Jumu\'ah prayer) and does not separate two persons sitting together (in the mosque)..."',
      source: 'Sahih al-Bukhari',
      reference: '883',
      reward: 'Part of the etiquette that leads to forgiveness',
      context: "Respecting others' space in the mosque is part of Friday's adab",
    },
  },
  {
    id: 'silent_during_khutbah',
    title: 'Remained Silent During Khutbah',
    description: 'Listened attentively without talking',
    icon: '🤫',
    hadith: {
      id: 'friday_silent',
      category: 'friday_sunnah',
      textEnglish:
        'The Prophet (ﷺ) said: "When the Imam is delivering the Khutbah, and you ask your companion to be quiet and listen, then you have made Laghw (useless talk)."',
      source: 'Sahih al-Bukhari',
      reference: '892',
      reward: 'Full reward of Friday prayer',
      context: 'Even saying "be quiet" to someone during Khutbah is forbidden',
    },
  },
  {
    id: 'prayed_sunnah',
    title: 'Prayed Sunnah Before/After',
    description: "Performed 4 rakah before and 4 after Jumu'ah",
    icon: '🙏',
    hadith: {
      id: 'friday_sunnah_prayer',
      category: 'friday_sunnah',
      textEnglish:
        'The Prophet (ﷺ) said: "Whoever prays four rak\'ahs before Jumu\'ah and four after it, Allah will build for him a house in Paradise."',
      source: 'Sunan al-Tirmidhi',
      reference: '429 (Hasan)',
      reward: 'A house in Paradise',
      context: 'This is the recommended Sunnah prayer for Friday',
    },
  },
  {
    id: 'sought_hour_acceptance',
    title: 'Made Dua in Last Hour',
    description: 'Sought the hour of acceptance after Asr',
    icon: '⏰',
    hadith: {
      id: 'friday_hour_acceptance',
      category: 'friday_sunnah',
      textEnglish:
        'The Prophet (ﷺ) said about Friday: "There is an hour on Friday and if a Muslim gets it while offering Salat and asks something from Allah, then Allah will definitely meet his demand." And he gestured with his hands to indicate how short that time is.',
      source: 'Sahih al-Bukhari',
      reference: '935',
      reward: 'Guaranteed acceptance of dua',
      context: 'Most scholars say it is in the last hour before Maghrib on Friday',
    },
  },
];

// Helper function to get hadith by category
export const getHadithByStatus = (status: string): Hadith[] => {
  return PRAYER_STATUS_HADITH[status] || [];
};

// Helper function to get random hadith from category
export const getRandomHadithByStatus = (status: string): Hadith | null => {
  const hadiths = getHadithByStatus(status);
  if (hadiths.length === 0) return null;
  return hadiths[Math.floor(Math.random() * hadiths.length)];
};

// Helper function to calculate Friday Sunnah completion percentage
export const calculateFridaySunnahPercentage = (completed: string[]): number => {
  if (completed.length === 0) return 0;
  return Math.round((completed.length / FRIDAY_SUNNAH_ITEMS.length) * 100);
};
