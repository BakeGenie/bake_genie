import React from 'react';
import { useSettings } from '@/contexts/settings-context';

interface FormatCurrencyProps {
  amount: number | string;
  showSymbol?: boolean;
  showCode?: boolean;
  className?: string;
}

/**
 * Component to format currency values according to user settings
 */
export const FormatCurrency: React.FC<FormatCurrencyProps> = ({
  amount,
  showSymbol = true,
  showCode = false,
  className = '',
}) => {
  const { settings } = useSettings();
  
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN
  if (isNaN(numericAmount)) {
    return <span className={className}>--</span>;
  }
  
  // Format the amount
  const formattedAmount = numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return (
    <span className={className}>
      {showSymbol && <span className="currency-symbol">{settings.currencySymbol}</span>}
      {formattedAmount}
      {showCode && <span className="currency-code ml-1">{settings.currency}</span>}
    </span>
  );
};

/**
 * Hook to format currency values according to user settings
 */
export const useFormatCurrency = () => {
  const { settings } = useSettings();
  
  return {
    format: (amount: number | string, options: { showSymbol?: boolean; showCode?: boolean } = {}) => {
      const { showSymbol = true, showCode = false } = options;
      
      // Convert string to number if needed
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      // Handle NaN
      if (isNaN(numericAmount)) {
        return '--';
      }
      
      // Format the amount
      const formattedAmount = numericAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      // Build the formatted string
      let result = '';
      if (showSymbol) {
        result += settings.currencySymbol;
      }
      result += formattedAmount;
      if (showCode) {
        result += ` ${settings.currency}`;
      }
      
      return result;
    },
    currencySymbol: settings.currencySymbol,
    currencyCode: settings.currency,
  };
};