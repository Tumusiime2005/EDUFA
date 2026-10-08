import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { CommitteeDashboard } from './components/CommitteeDashboard.tsx';
import { ApplicantPortal } from './components/ApplicantPortal.tsx';
import { NewApplicationModal } from './components/NewApplicationModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Scale, Shield, GraduationCap, Sparkles, RefreshCw, Database } from 'lucide-react';

function MainApp() {
  const { activeRole, currentUser } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-neutral-100 flex flex-col font-sans">
      {/* Navbar with role switcher, anonymized mode, and notifications */}
      <Navbar onOpenNewApplicationModal={() => setIsNewModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && applications.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-neutral-400">Loading dossiers from Cloud SQL PostgreSQL...</p>
          </div>
        ) : (
          <>
            {activeRole === 'committee' ? (
              <CommitteeDashboard
                applications={applications}
                onRefresh={fetchApplications}
                onOpenNewApplicationModal={() => setIsNewModalOpen(true)}
              />
            ) : (
              <ApplicantPortal
                applications={applications}
                onRefresh={fetchApplications}
                onOpenNewApplicationModal={() => setIsNewModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Application Creation Wizard Modal */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmitted={() => {
          fetchApplications();
        }}
      />

      {/* Authentication & Registration Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/70 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
            DRAGONS ENTERPRISES
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
