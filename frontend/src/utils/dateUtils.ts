
/**
 * Convert a date value into a readable date.
 * Returns an em dash for missing or invalid dates.
 */
export const formatDate = (
  value: string | Date | null | undefined,
  locale = "en-IN"
): string => {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/**
 * Convert a date into YYYY-MM-DD for HTML date inputs.
 */
export const toDateInputValue = (
  value: string | Date | null | undefined
): string => {
  if (!value) return "";

  // Preserve a database date-only value without timezone conversion.
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Calculate the number of completed years between two dates.
 */
export const calculateAge = (
  dateOfBirth: string | Date | null | undefined
): number | null => {
  if (!dateOfBirth) return null;

  const birthDate =
    dateOfBirth instanceof Date
      ? dateOfBirth
      : new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayHasNotOccurred =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};
