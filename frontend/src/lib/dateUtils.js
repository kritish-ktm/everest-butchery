const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const BS_CALENDAR = {
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
};

const BS_ANCHOR = {
  ad: "2025-04-14",
  bsYear: 2082,
  bsMonth: 1,
  bsDay: 1,
};

function atNoon(dateLike) {
  const date = new Date(`${dateLike}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateLike, options = {}) {
  const date = typeof dateLike === "string" ? atNoon(dateLike) : dateLike;
  if (!date) return "";
  return new Intl.DateTimeFormat("en-DK", {
    weekday: options.weekday || "short",
    day: "numeric",
    month: "short",
    year: options.year || undefined,
  }).format(date);
}

export function toNepaliDate(dateLike) {
  const date = typeof dateLike === "string" ? atNoon(dateLike) : dateLike;
  const anchor = atNoon(BS_ANCHOR.ad);
  if (!date || !anchor) return null;

  let diff = Math.floor((date.getTime() - anchor.getTime()) / 86400000);
  let bsYear = BS_ANCHOR.bsYear;
  let bsMonth = BS_ANCHOR.bsMonth;
  let bsDay = BS_ANCHOR.bsDay;

  while (diff > 0) {
    const monthLength = BS_CALENDAR[bsYear]?.[bsMonth - 1];
    if (!monthLength) return null;
    bsDay += 1;
    if (bsDay > monthLength) {
      bsDay = 1;
      bsMonth += 1;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear += 1;
      }
    }
    diff -= 1;
  }

  while (diff < 0) {
    bsDay -= 1;
    if (bsDay < 1) {
      bsMonth -= 1;
      if (bsMonth < 1) {
        bsMonth = 12;
        bsYear -= 1;
      }
      const monthLength = BS_CALENDAR[bsYear]?.[bsMonth - 1];
      if (!monthLength) return null;
      bsDay = monthLength;
    }
    diff += 1;
  }

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthName: BS_MONTHS[bsMonth - 1],
    label: `${bsDay} ${BS_MONTHS[bsMonth - 1]} ${bsYear} BS`,
  };
}

export function formatNepaliDate(dateLike) {
  return toNepaliDate(dateLike)?.label || formatDisplayDate(dateLike, { year: "numeric" });
}
