import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the shape of our settings
export interface Settings {
  currency: string;
  currencySymbol: string;
  weekStartDay: string;
  language: string;
  hourlyRate: string;
  markupMargin: string;
  nextOrderNumber: number;
  // Tax settings
  taxEnabled?: boolean;
  useGst?: boolean;
  useTaxInvoice?: boolean;
  // Email notification settings
  emailAddress?: string;
  secondaryEmailAddress?: string;
  receiveUpcomingOrders?: boolean;
  upcomingOrdersFrequency?: 'daily' | 'weekly' | 'monthly';
  receivePaymentReminders?: boolean;
  receiveMarketingEmails?: boolean;
  receiveProductUpdates?: boolean;
  // Email templates
  quoteEmailTemplate?: string;
  invoiceEmailTemplate?: string;
  paymentReminderTemplate?: string;
  paymentReceiptTemplate?: string;
  enquiryMessageTemplate?: string;
  // Business details for invoices and orders
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessLogoUrl?: string;
  // Footer text for invoices and quotes
  invoiceFooter?: string;
  quoteFooter?: string;
}

// Define what our context provides
interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<boolean>;
  getCurrencySymbol: (currencyCode: string) => string;
}

// Create the context with default values
const SettingsContext = createContext<SettingsContextType>({
  settings: {
    currency: 'AUD',
    currencySymbol: '$',
    weekStartDay: 'Monday',
    language: 'English',
    hourlyRate: '',
    markupMargin: '',
    nextOrderNumber: 1,
    // Default tax settings
    taxEnabled: true,
    useGst: false,
    useTaxInvoice: false,
    // Default email settings
    emailAddress: '',
    secondaryEmailAddress: '',
    receiveUpcomingOrders: false,
    upcomingOrdersFrequency: 'weekly',
    receivePaymentReminders: false,
    receiveMarketingEmails: false,
    receiveProductUpdates: false,
    // Default business details
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessLogoUrl: '',
    // Default footer text
    invoiceFooter: '',
    quoteFooter: '',
  },
  isLoading: true,
  updateSettings: async () => false,
  getCurrencySymbol: () => '$',
});

// Currency mapping of code to symbol
const currencySymbols: Record<string, string> = {
  AUD: '$',
  USD: '$',
  EUR: '€',
  GBP: '£',
  NZD: '$',
  CAD: '$',
  CHF: 'Fr',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  MXN: '$',
  SGD: '$',
  HKD: '$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  AED: 'د.إ',
  AFN: '؋',
  ALL: 'L',
  AMD: '֏',
  ANG: 'ƒ',
  AOA: 'Kz',
  ARS: '$',
  AWG: 'ƒ',
  AZN: '₼',
  BAM: 'KM',
  BBD: '$',
  BDT: '৳',
  BGN: 'лв',
  BHD: '.د.ب',
  BIF: 'FBu',
  BMD: '$',
  BND: '$',
  BOB: 'Bs.',
  BTN: 'Nu.',
  BWP: 'P',
  BYN: 'Br',
  BZD: 'BZ$',
  CDF: 'FC',
  CLP: '$',
  COP: '$',
  CRC: '₡',
  CVE: '$',
  CZK: 'Kč',
  DJF: 'Fdj',
  DOP: 'RD$',
  DZD: 'دج',
  // Add more as needed
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    currency: 'AUD',
    currencySymbol: '$',
    weekStartDay: 'Monday',
    language: 'English',
    hourlyRate: '',
    markupMargin: '',
    nextOrderNumber: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Function to get currency symbol for a currency code
  const getCurrencySymbol = (currencyCode: string): string => {
    return currencySymbols[currencyCode] || '$';
  };

  // Load settings from server on initial load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        
        // Update settings with fetched data
        setSettings({
          ...settings,
          ...data,
          // Make sure currencySymbol is set based on currency
          currencySymbol: getCurrencySymbol(data.currency || settings.currency),
        });
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Update settings - both locally and on the server
  const updateSettings = async (newSettings: Partial<Settings>): Promise<boolean> => {
    try {
      // If changing currency, also update currency symbol
      if (newSettings.currency) {
        newSettings.currencySymbol = getCurrencySymbol(newSettings.currency);
      }
      
      // Update local state immediately for responsiveness
      setSettings(prevSettings => ({
        ...prevSettings,
        ...newSettings,
      }));
      
      // Save to server
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings,
        isLoading,
        updateSettings,
        getCurrencySymbol,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = () => useContext(SettingsContext);