'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// The backend's base currency — product prices and order totals are
// stored in EUR directly, set by the admin, never derived from a live
// rate. Displaying in EUR (the default everywhere on this storefront)
// needs no conversion at all, so it can't drift just from being shown.
export const DISPLAY_CURRENCY = 'EUR';

// RSD is intentionally excluded — PayGate can't settle in it ("Coin not
// supported"), so Serbian customers pay in EUR like the rest of the EU.
export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'SEK', label: 'SEK (kr) — Sweden' },
  { value: 'NOK', label: 'NOK (kr) — Norway' },
  { value: 'DKK', label: 'DKK (kr) — Denmark' },
  { value: 'GBP', label: 'GBP (£) — UK' },
  { value: 'USD', label: 'USD ($)' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
};

// Formats an amount that is already in `currency` (no conversion).
export function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
}

interface CurrencyContextType {
  // EUR value of 1 unit of each currency, e.g. { EUR: 1, SEK: 0.0906 }.
  // Only needed for the checkout currency selector — never for the
  // default EUR price display.
  rates: Record<string, number>;
  ready: boolean;
  formatPrice: (eurAmount: number, currency?: string) => string;
  convert: (eurAmount: number, currency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/currency/rates`)
      .then((res) => res.json())
      .then((data: Record<string, number>) => {
        setRates(data);
        setReady(true);
      })
      .catch((err) => {
        console.error('Failed to load currency rates:', err);
      });
  }, []);

  const convert = (eurAmount: number, currency: string): number => {
    if (currency === 'EUR') return eurAmount;
    const rate = rates[currency];
    if (!rate) return eurAmount;
    return eurAmount / rate;
  };

  const formatPrice = (eurAmount: number, currency: string = DISPLAY_CURRENCY): string => {
    // EUR is the base currency itself — no rate lookup needed, so this
    // path (used for every default price on the site) can never drift.
    if (currency === 'EUR') {
      return `€${eurAmount.toFixed(2)}`;
    }
    // Before rates load, or if a rate is missing, fall back to EUR rather
    // than mislabeling a euro figure with the wrong symbol.
    if (!ready || !rates[currency]) {
      return `€${eurAmount.toFixed(2)}`;
    }
    return formatAmount(convert(eurAmount, currency), currency);
  };

  return (
    <CurrencyContext.Provider value={{ rates, ready, formatPrice, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
