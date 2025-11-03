/**
 * Congratulations and Encouragement Messages
 * For prayer reward gamification
 */

/**
 * Congratulations messages for Jamaah (congregation) prayers
 * Rotate randomly to keep experience fresh
 */
export const JAMAAH_CONGRATULATIONS = [
  'MashAllah! Jamaah prayer earns 27× reward!',
  'Excellent! You\'re following the Sunnah of praying in congregation!',
  'Barakah increased! Jamaah brings immense blessings!',
  'Wonderful! Keep up the blessed habit of praying together!',
  'Amazing! Congregation prayer is beloved to Allah!',
  'Alhamdulillah! You chose the better path!',
] as const;

/**
 * Encouragement messages for praying alone
 * Gentle reminders about Jamaah benefits
 */
export const ALONE_ENCOURAGEMENT = [
  'May Allah accept your prayer. Try Jamaah when possible!',
  'Allah knows your situation. Strive for Jamaah next time!',
  'Your prayer is accepted. Jamaah brings extra reward!',
  'Well done for praying! Jamaah multiplies the blessing 27×',
  'Keep praying! Jamaah adds tremendous reward when you can!',
  'May Allah make it easy for you to pray in Jamaah soon!',
] as const;

/**
 * Hadith about Jamaah prayer rewards
 * Source: Sahih al-Bukhari 645, Sahih Muslim 650
 */
export const JAMAAH_HADITH = {
  textEnglish: 'The Prophet (ﷺ) said: "Prayer in congregation is twenty-seven times superior to prayer offered by a person alone."',
  source: 'Sahih al-Bukhari',
  reference: '645',
} as const;

/**
 * Get random congratulations message for Jamaah
 */
export const getRandomJamaahMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * JAMAAH_CONGRATULATIONS.length);
  return JAMAAH_CONGRATULATIONS[randomIndex];
};

/**
 * Get random encouragement message for praying alone
 */
export const getRandomAloneMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * ALONE_ENCOURAGEMENT.length);
  return ALONE_ENCOURAGEMENT[randomIndex];
};
