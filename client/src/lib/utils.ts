import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface DateFormatOptions {
  short?: boolean;
  withTime?: boolean;
  dayOfWeek?: boolean;
}

export function formatDate(date: Date, options: DateFormatOptions = {}) {
  if (!date) return "";
  
  try {
    const { short = false, withTime = false, dayOfWeek = false } = options;
    
    let formatString = "MMM d, yyyy";
    
    if (short) {
      formatString = "MM/dd/yyyy";
    }
    
    if (dayOfWeek) {
      formatString = `EEE, ${formatString}`;
    }
    
    if (withTime) {
      formatString = `${formatString} h:mm a`;
    }
    
    return format(new Date(date), formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date);
  }
}
