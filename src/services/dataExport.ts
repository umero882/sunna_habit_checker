/**
 * Data Export Service
 * Handles exporting user data to PDF format for weekly/monthly reports
 */

import { supabase } from './supabase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { createLogger } from '../utils/logger';

const logger = createLogger('dataExport');

export type ExportPeriod = 'week' | 'month';

export interface ExportData {
  period: ExportPeriod;
  startDate: string;
  endDate: string;
  user: {
    email?: string;
    name?: string;
  };
  prayers: {
    totalLogged: number;
    onTime: number;
    delayed: number;
    missed: number;
    percentage: number;
    breakdown: Record<string, { onTime: number; total: number }>;
  };
  quran: {
    totalSessions: number;
    totalMinutes: number;
    totalPages: number;
    averagePerDay: number;
  };
  sunnah: {
    totalCompleted: number;
    byLevel: {
      basic: number;
      companion: number;
      prophetic: number;
    };
    topHabits: Array<{ name: string; count: number }>;
  };
  charity: {
    totalEntries: number;
    types: {
      money: number;
      time: number;
      kindDeeds: number;
    };
  };
  reflections: {
    totalEntries: number;
    averageKhushu?: number;
  };
}

/**
 * Fetch all user data for the specified period
 */
export const fetchExportData = async (period: ExportPeriod): Promise<ExportData> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Calculate date range
  const now = new Date();
  const startDate =
    period === 'week'
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);
  const endDate =
    period === 'week'
      ? endOfWeek(now, { weekStartsOn: 1 })
      : endOfMonth(now);

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // Fetch prayer data
  const { data: prayerLogs } = await supabase
    .from('prayer_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  // Fetch Quran data
  const { data: quranLogs } = await supabase
    .from('quran_reading_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  // Fetch Sunnah data
  const { data: sunnahLogs } = await supabase
    .from('sunnah_logs')
    .select(`
      *,
      sunnah_habits (name, name_ar)
    `)
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  // Fetch charity data
  const { data: charityEntries } = await supabase
    .from('charity_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  // Fetch reflections
  const { data: journalEntries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  // Process prayer data
  const prayerStats = {
    totalLogged: prayerLogs?.length || 0,
    onTime: prayerLogs?.filter((log) => log.status === 'on_time').length || 0,
    delayed: prayerLogs?.filter((log) => log.status === 'delayed').length || 0,
    missed: prayerLogs?.filter((log) => log.status === 'missed').length || 0,
    percentage: 0,
    breakdown: {} as Record<string, { onTime: number; total: number }>,
  };

  if (prayerStats.totalLogged > 0) {
    prayerStats.percentage = Math.round((prayerStats.onTime / prayerStats.totalLogged) * 100);
  }

  // Calculate prayer breakdown by name
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  prayers.forEach((prayer) => {
    const prayerCount = prayerLogs?.filter((log) => log.prayer === prayer) || [];
    const onTimeCount = prayerCount.filter((log) => log.status === 'on_time').length;
    prayerStats.breakdown[prayer] = {
      onTime: onTimeCount,
      total: prayerCount.length,
    };
  });

  // Process Quran data
  const quranStats = {
    totalSessions: quranLogs?.length || 0,
    totalMinutes: quranLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0,
    totalPages: quranLogs?.reduce((sum, log) => sum + (log.pages_read || 0), 0) || 0,
    averagePerDay: 0,
  };

  const daysInPeriod = period === 'week' ? 7 : 30;
  if (quranStats.totalSessions > 0) {
    quranStats.averagePerDay = Math.round(quranStats.totalMinutes / daysInPeriod);
  }

  // Process Sunnah data
  const sunnahByLevel = {
    basic: sunnahLogs?.filter((log) => log.level === 'basic').length || 0,
    companion: sunnahLogs?.filter((log) => log.level === 'companion').length || 0,
    prophetic: sunnahLogs?.filter((log) => log.level === 'prophetic').length || 0,
  };

  // Calculate top 5 Sunnah habits
  const habitCounts = new Map<string, number>();
  sunnahLogs?.forEach((log) => {
    const habitName = log.sunnah_habits?.name || 'Unknown';
    habitCounts.set(habitName, (habitCounts.get(habitName) || 0) + 1);
  });

  const topHabits = Array.from(habitCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const sunnahStats = {
    totalCompleted: sunnahLogs?.length || 0,
    byLevel: sunnahByLevel,
    topHabits,
  };

  // Process charity data
  const charityStats = {
    totalEntries: charityEntries?.length || 0,
    types: {
      money: charityEntries?.filter((entry) => entry.kind === 'money').length || 0,
      time: charityEntries?.filter((entry) => entry.kind === 'time').length || 0,
      kindDeeds: charityEntries?.filter((entry) => entry.kind === 'kind_deed').length || 0,
    },
  };

  // Process reflection data
  const reflectionStats = {
    totalEntries: journalEntries?.length || 0,
    averageKhushu:
      journalEntries && journalEntries.length > 0
        ? Math.round(
            journalEntries.reduce((sum, entry) => sum + (entry.khushu_level || 0), 0) /
              journalEntries.length
          )
        : undefined,
  };

  return {
    period,
    startDate: startDateStr,
    endDate: endDateStr,
    user: {
      email: user.email,
      name: user.user_metadata?.name,
    },
    prayers: prayerStats,
    quran: quranStats,
    sunnah: sunnahStats,
    charity: charityStats,
    reflections: reflectionStats,
  };
};

/**
 * Generate HTML for PDF report
 */
const generateReportHTML = (data: ExportData): string => {
  const periodLabel = data.period === 'week' ? 'Weekly' : 'Monthly';
  const userName = data.user.name || data.user.email?.split('@')[0] || 'User';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 40px;
      color: #2c3e50;
      background: #f8f9fa;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 20px;
      background: linear-gradient(135deg, #2d5e4f 0%, #3d7a5f 100%);
      color: white;
      border-radius: 12px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .header p {
      margin: 5px 0;
      opacity: 0.9;
    }
    .section {
      background: white;
      padding: 24px;
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .section h2 {
      color: #2d5e4f;
      margin-top: 0;
      border-bottom: 2px solid #2d5e4f;
      padding-bottom: 12px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    .stat-card {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #2d5e4f;
    }
    .stat-label {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #2d5e4f;
    }
    .progress-bar {
      width: 100%;
      height: 24px;
      background: #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2d5e4f 0%, #4a9d7d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
    }
    .habit-list {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }
    .habit-item {
      padding: 12px;
      background: #f8f9fa;
      margin-bottom: 8px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .verse {
      font-style: italic;
      text-align: center;
      padding: 24px;
      background: #f8f9fa;
      border-left: 4px solid #d4af37;
      margin: 24px 0;
      color: #495057;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🕌 ${periodLabel} Spiritual Progress Report</h1>
    <p>${userName}</p>
    <p>${format(new Date(data.startDate), 'MMM d, yyyy')} - ${format(new Date(data.endDate), 'MMM d, yyyy')}</p>
  </div>

  <div class="verse">
    "The strong believer is better and more beloved to Allah than the weak believer,
    while there is good in both." — Prophet Muhammad ﷺ (Sahih Muslim 2664)
  </div>

  <div class="section">
    <h2>🕋 Prayers</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Logged</div>
        <div class="stat-value">${data.prayers.totalLogged}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">On Time</div>
        <div class="stat-value">${data.prayers.onTime}</div>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${data.prayers.percentage}%">
        ${data.prayers.percentage}% On Time
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📖 Quran Reading</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Sessions</div>
        <div class="stat-value">${data.quran.totalSessions}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Minutes</div>
        <div class="stat-value">${data.quran.totalMinutes}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pages Read</div>
        <div class="stat-value">${data.quran.totalPages}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. Per Day</div>
        <div class="stat-value">${data.quran.averagePerDay}m</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>☀️ Sunnah Habits</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Completed</div>
        <div class="stat-value">${data.sunnah.totalCompleted}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Basic Level</div>
        <div class="stat-value">${data.sunnah.byLevel.basic}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Companion Level</div>
        <div class="stat-value">${data.sunnah.byLevel.companion}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Prophetic Level</div>
        <div class="stat-value">${data.sunnah.byLevel.prophetic}</div>
      </div>
    </div>
    ${
      data.sunnah.topHabits.length > 0
        ? `
    <h3 style="margin-top: 24px; color: #495057;">Top Habits</h3>
    <ul class="habit-list">
      ${data.sunnah.topHabits
        .map(
          (habit) => `
        <li class="habit-item">
          <span>${habit.name}</span>
          <strong>${habit.count}x</strong>
        </li>
      `
        )
        .join('')}
    </ul>
    `
        : ''
    }
  </div>

  <div class="section">
    <h2>💝 Charity & Reflections</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Charity Entries</div>
        <div class="stat-value">${data.charity.totalEntries}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Journal Entries</div>
        <div class="stat-value">${data.reflections.totalEntries}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>🤖 Generated with Sunnah Habit Checker</p>
    <p>"Take account of yourselves before you are taken to account." — Umar ibn al-Khattab (RA)</p>
  </div>
</body>
</html>
  `;
};

/**
 * Generate and export PDF report using expo-print (client-side)
 */
export const generatePDFReport = async (period: ExportPeriod): Promise<string> => {
  try {
    logger.info('Starting PDF generation for period:', period);

    // Fetch data
    const data = await fetchExportData(period);
    logger.info('Data fetched successfully');

    // Generate HTML
    const html = generateReportHTML(data);
    logger.info('HTML generated successfully');

    // Generate PDF using expo-print (client-side, no backend needed!)
    const { uri } = await Print.printToFileAsync({ html });
    logger.info('PDF generated successfully at:', uri);

    return uri;
  } catch (error: any) {
    logger.error('Error in generatePDFReport:', error);
    throw new Error(`Failed to generate PDF report: ${error.message}`);
  }
};

/**
 * Share PDF report
 */
export const sharePDFReport = async (period: ExportPeriod): Promise<void> => {
  try {
    const pdfUri = await generatePDFReport(period);
    logger.info('PDF report ready to share:', pdfUri);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('Sharing not available, file saved at:', pdfUri);
      throw new Error(`Sharing is not available on this device. Your PDF report has been saved to: ${pdfUri}`);
    }

    // Share the PDF
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: `${period === 'week' ? 'Weekly' : 'Monthly'} Spiritual Progress Report`,
      UTI: 'com.adobe.pdf',
    });

    logger.info('PDF shared successfully');
  } catch (error: any) {
    logger.error('Error sharing PDF:', error);
    // Re-throw with more context if it's not already a user-friendly message
    if (error.message && error.message.includes('saved to:')) {
      throw error;
    }
    throw new Error(`Failed to share PDF report: ${error.message || 'Unknown error'}`);
  }
};
