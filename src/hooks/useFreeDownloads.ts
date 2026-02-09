const STORAGE_KEY = "up4down_free_downloads";

interface DownloadTracking {
  daily: { count: number; date: string };
  monthly: { count: number; month: string };
}

const getToday = () => new Date().toISOString().split("T")[0];
const getMonth = () => new Date().toISOString().slice(0, 7);

const getTracking = (): DownloadTracking => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error();
    return JSON.parse(raw);
  } catch {
    return {
      daily: { count: 0, date: getToday() },
      monthly: { count: 0, month: getMonth() },
    };
  }
};

const saveTracking = (tracking: DownloadTracking) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracking));
};

export const useFreeDownloads = () => {
  const canDownload = (dailyLimit: number, monthlyLimit: number): boolean => {
    const tracking = getTracking();
    const today = getToday();
    const month = getMonth();

    const dailyCount = tracking.daily.date === today ? tracking.daily.count : 0;
    const monthlyCount = tracking.monthly.month === month ? tracking.monthly.count : 0;

    return dailyCount < dailyLimit && monthlyCount < monthlyLimit;
  };

  const recordDownload = () => {
    const tracking = getTracking();
    const today = getToday();
    const month = getMonth();

    tracking.daily = {
      count: tracking.daily.date === today ? tracking.daily.count + 1 : 1,
      date: today,
    };
    tracking.monthly = {
      count: tracking.monthly.month === month ? tracking.monthly.count + 1 : 1,
      month,
    };

    saveTracking(tracking);
  };

  const getRemainingDownloads = (dailyLimit: number, monthlyLimit: number) => {
    const tracking = getTracking();
    const today = getToday();
    const month = getMonth();

    const dailyUsed = tracking.daily.date === today ? tracking.daily.count : 0;
    const monthlyUsed = tracking.monthly.month === month ? tracking.monthly.count : 0;

    return {
      dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
      monthlyRemaining: Math.max(0, monthlyLimit - monthlyUsed),
    };
  };

  return { canDownload, recordDownload, getRemainingDownloads };
};
