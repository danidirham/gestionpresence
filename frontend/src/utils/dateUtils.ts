/**
 * Utility functions for date handling
 */

/**
 * Format a date safely, handling various input formats
 * @param dateString The date string to format
 * @param locale The locale to use for formatting (default: 'fr-FR')
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (dateString: string | null | undefined, locale: string = 'fr-FR'): string => {
  if (!dateString) return '';
  
  try {
    // Try to parse the date
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      // If the date is invalid, try to parse it as a ISO date (YYYY-MM-DD)
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);
        
        if (!isNaN(newDate.getTime())) {
          return newDate.toLocaleDateString(locale);
        }
      }
      
      // If all parsing attempts fail, return empty string
      return '';
    }
    
    // Format the date using the specified locale
    return date.toLocaleDateString(locale);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Ensure a date is in ISO format (YYYY-MM-DD)
 * @param dateString The date string to format
 * @returns ISO formatted date string or empty string if invalid
 */
export const ensureISODate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    // If it's already in ISO format, return it
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Try to parse the date
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format as ISO date (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting ISO date:', error);
    return '';
  }
};
