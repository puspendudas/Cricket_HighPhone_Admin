import 'src/global.css';

// ----------------------------------------------------------------------

import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Router } from 'src/routes/sections';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import { ThemeProvider } from 'src/theme/theme-provider';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 500,
    },
  },
});

export default function App() {
  useScrollToTop();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider settings={defaultSettings}>
          <ThemeProvider>
            <MotionLazy>
              <Toaster richColors position="bottom-right" />
              <ProgressBar />
              <SettingsDrawer />
              <Router />
            </MotionLazy>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}