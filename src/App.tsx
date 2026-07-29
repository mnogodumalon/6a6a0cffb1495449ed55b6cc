import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import PublicPagesAdmin from '@/pages/PublicPagesAdmin';
import SachbearbeiterPage from '@/pages/SachbearbeiterPage';
import SachbearbeiterDetailPage from '@/pages/SachbearbeiterDetailPage';
import FoerderantraegePage from '@/pages/FoerderantraegePage';
import FoerderantraegeDetailPage from '@/pages/FoerderantraegeDetailPage';
// <custom:imports>
const AntragEinreichenPage = lazy(() => import('@/pages/intents/AntragEinreichenPage'));
// </custom:imports>

// Lazy: public pages live outside <Layout> and only load on /#/public/:slug —
// dashboard users never pay for them, anonymous visitors skip the dashboard.
const PublicPage = lazy(() => import('@/pages/public/PublicPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/:slug" element={<Suspense fallback={null}><PublicPage /></Suspense>} />
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="sachbearbeiter" element={<SachbearbeiterPage />} />
                <Route path="sachbearbeiter/:id" element={<SachbearbeiterDetailPage />} />
                <Route path="foerderantraege" element={<FoerderantraegePage />} />
                <Route path="foerderantraege/:id" element={<FoerderantraegeDetailPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="verwaltung/oeffentliche-seiten" element={<PublicPagesAdmin />} />
                {/* <custom:routes> */}
                <Route path="intents/antrag-einreichen" element={<Suspense fallback={null}><AntragEinreichenPage /></Suspense>} />
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
