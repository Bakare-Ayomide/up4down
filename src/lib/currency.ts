// Free currency conversion using frankfurter.app (European Central Bank rates)
const CACHE_KEY = "currency_rates_cache";
const CACHE_DURATION = 3600000; // 1 hour

interface CacheEntry {
  rates: Record<string, number>;
  timestamp: number;
  base: string;
}

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
];

export const convertCurrency = async (
  amount: number,
  from: string,
  to: string
): Promise<number> => {
  if (from === to) return amount;

  try {
    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (entry.base === from && Date.now() - entry.timestamp < CACHE_DURATION && entry.rates[to]) {
        return Math.round(amount * entry.rates[to] * 100) / 100;
      }
    }

    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&amount=${amount}`);
    const data = await res.json();

    // Cache rates
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rates: data.rates,
      timestamp: Date.now(),
      base: from,
    }));

    return Math.round((data.rates[to] || amount) * 100) / 100;
  } catch {
    return amount; // fallback
  }
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return `${currency?.symbol || ""}${amount.toFixed(2)} ${currencyCode}`;
};
