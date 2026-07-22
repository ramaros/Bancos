export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// Parse a string like "junho-25" or "julho-26" into a sortable date value
export function parseMonthYearToSortValue(str: string): number {
  if (!str) return 0;
  const parts = str.toLowerCase().trim().split("-");
  if (parts.length !== 2) return 0;

  const [monthStr, yearStr] = parts;
  const monthIndex = MONTHS_PT.indexOf(monthStr);
  const yearNum = parseInt(yearStr, 10);

  if (monthIndex === -1 || isNaN(yearNum)) return 0;

  // e.g., year 25 and month index 5 => 2025 * 12 + 5 = 24305
  // This allows correct mathematical comparison
  return (2000 + yearNum) * 12 + monthIndex;
}

// Format the current date into active month string (e.g. "julho-26")
export function getCurrentMonthStr(): string {
  const now = new Date();
  const monthName = MONTHS_PT[now.getMonth()];
  const year2Digits = now.getFullYear().toString().slice(-2);
  return `${monthName}-${year2Digits}`;
}

// Sort history list chronologically
export function sortHistoryChronologically<T extends { data: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    return parseMonthYearToSortValue(a.data) - parseMonthYearToSortValue(b.data);
  });
}
