/**
 * Date formatting utilities
 * Centralized date formatting functions to avoid code duplication
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/**
 * Format a date to a readable string
 * @param date - Date object or string
 * @param formatStr - Format string (e.g., "MMM d, yyyy", "MMM yyyy", "h:mm a")
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatStr: string): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }

  switch (formatStr) {
    case "MMM d, yyyy":
      return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    case "MMM yyyy":
      return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    case "MMM d":
      return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    case "h:mm a":
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    case "yyyy-MM-dd":
      return d.toISOString().split("T")[0];
    default:
      return d.toLocaleDateString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * @param date - Date object or string
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
}

/**
 * Check if a date is today
 * @param date - Date object or string
 * @returns True if the date is today
 */
export function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the current month
 * @param date - Date object or string
 * @returns True if the date is in the current month
 */
export function isCurrentMonth(date: Date | string): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

