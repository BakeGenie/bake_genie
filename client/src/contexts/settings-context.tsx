import React, { createContext, useState, useContext, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

// Define the settings context type
interface SettingsContextType {
  currency: string;
  currencySymbol: string;
  weekStartDay: string;
  language: string;
  hourlyRate: string;
  markupMargin: string;
  updateSettings: (settings: Partial<SettingsState>) => Promise<void>;
}

// Define the settings state structure
interface SettingsState {
  currency: string;
  currencySymbol: string;
  weekStartDay: string;
  language: string;
  hourlyRate: string;
  markupMargin: string;
}

// Currency symbols lookup object
const currencySymbols: Record<string, string> = {
  "AUD": "$",
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  "AED": "د.إ",
  "ARS": "$",
  "BDT": "৳",
  "BGN": "лв",
  "BRL": "R$",
  "CAD": "$",
  "CHF": "Fr",
  "CLP": "$",
  "CNY": "¥",
  "COP": "$",
  "CZK": "Kč",
  "DKK": "kr",
  "EGP": "£",
  "HKD": "$",
  "HRK": "kn",
  "HUF": "Ft",
  "IDR": "Rp",
  "ILS": "₪",
  "INR": "₹",
  "JPY": "¥",
  "KES": "KSh",
  "KRW": "₩",
  "KWD": "د.ك",
  "LKR": "₨",
  "MAD": "د.م.",
  "MXN": "$",
  "MYR": "RM",
  "NGN": "₦",
  "NOK": "kr",
  "NZD": "$",
  "PEN": "S/",
  "PHP": "₱",
  "PKR": "₨",
  "PLN": "zł",
  "QAR": "ر.ق",
  "RON": "lei",
  "RSD": "дин.",
  "SAR": "ر.س",
  "SEK": "kr",
  "SGD": "$",
  "THB": "฿",
  "TRY": "₺",
  "TWD": "NT$",
  "UAH": "₴",
  "VND": "₫",
  "ZAR": "R",
};

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Default settings values
const defaultSettings: SettingsState = {
  currency: "AUD",
  currencySymbol: "$",
  weekStartDay: "Monday",
  language: "English",
  hourlyRate: "30.00",
  markupMargin: "40",
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  // Fetch settings from API on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response: any = await apiRequest("GET", "/api/settings");
        if (response && typeof response === 'object' && Object.keys(response).length > 0) {
          // Ensure we have a currency symbol even if it's a new currency not in our lookup
          const currencySymbol = 
            response.currency && currencySymbols[response.currency] 
              ? currencySymbols[response.currency] 
              : "$";
              
          setSettings({
            ...defaultSettings,
            ...response,
            currencySymbol
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        // If there's an error, we'll use the default settings
      }
    };

    fetchSettings();
  }, []);

  // Update settings - both locally and on the server
  const updateSettings = async (newSettings: Partial<SettingsState>) => {
    try {
      // If currency is being updated, also update the currency symbol
      let updatedSettings = { ...newSettings };
      if (newSettings.currency && currencySymbols[newSettings.currency]) {
        updatedSettings.currencySymbol = currencySymbols[newSettings.currency];
      }
      
      // Update the settings in the API
      await apiRequest("PATCH", "/api/settings", updatedSettings);
      
      // Update local state
      setSettings(prev => ({ 
        ...prev, 
        ...updatedSettings 
      }));
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  const value = {
    ...settings,
    updateSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};