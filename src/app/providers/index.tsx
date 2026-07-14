import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    const toTitleCase = (str: string) => {
      if (!str) return str;
      return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && target.tagName === 'INPUT' && target.type === 'text') {
        const nameAttr = target.name || '';
        if (nameAttr.includes('email') || nameAttr.includes('password') || nameAttr.includes('username') || nameAttr.includes('coord') || nameAttr.includes('koordinat') || target.classList.contains('no-capitalize')) {
          return;
        }

        const val = target.value;
        if (val) {
          const formatted = toTitleCase(val);
          if (formatted !== val) {
            target.value = formatted;
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      } else if (target && target.tagName === 'TEXTAREA') {
        const val = target.value;
        if (val) {
          const formatted = toTitleCase(val);
          if (formatted !== val) {
            target.value = formatted;
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
