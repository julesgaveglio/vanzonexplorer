'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface AgentInfo {
  id: number;
  folderName: string;
  status: 'active' | 'idle';
}

export function PixelAgentsWidgetClient() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Poll status every 3s when modal is closed
  useEffect(() => {
    if (modalOpen) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/admin/pixel-agents/status');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents ?? []);
        }
      } catch {
        // Silent — not critical
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [modalOpen]);

  // Trigger SSE connection in shim when iframe loads
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'startPixelAgents' },
        window.location.origin
      );
    }
  }, []);

  // Close modal with Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const activeCount = agents.filter((a) => a.status === 'active').length;

  const modal = modalOpen
    ? ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Clickable overlay to close */}
          <div
            onClick={() => setModalOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              cursor: 'pointer',
            }}
          />
          {/* Modal content above overlay */}
          <div
            style={{
              position: 'relative',
              width: '90vw',
              height: '90vh',
              zIndex: 1,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <iframe
              ref={iframeRef}
              src="/pixel-agents/index.html"
              onLoad={handleIframeLoad}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Pixel Office"
            />
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Compact widget */}
      <div
        onClick={() => setModalOpen(true)}
        className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 transition-colors hover:border-blue-500/50 hover:bg-slate-800"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        aria-label="Ouvrir Pixel Office"
      >
        <span className="text-xl">🏢</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-400">Pixel Office</p>
          <p className="text-xs text-slate-400">
            {agents.length === 0
              ? 'Aucun agent détecté · cliquer pour voir'
              : `${agents.length} agent${agents.length > 1 ? 's' : ''} · ${activeCount} actif${activeCount > 1 ? 's' : ''} · cliquer pour voir`}
          </p>
        </div>
        {/* Status dots */}
        <div className="flex gap-1.5">
          {agents.slice(0, 5).map((agent) => (
            <span
              key={agent.id}
              title={`${agent.folderName} (${agent.status})`}
              className={`h-2.5 w-2.5 rounded-full ${
                agent.status === 'active' ? 'bg-green-400' : 'bg-slate-500'
              }`}
            />
          ))}
          {agents.length === 0 && (
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          )}
        </div>
      </div>

      {modal}
    </>
  );
}
