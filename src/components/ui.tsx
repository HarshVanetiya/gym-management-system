'use client';

import { useEffect, type ReactNode } from 'react';
import { STATUS_LABEL, type MemberStatus } from '../lib/utils';
import { Icon } from './icons';

export function StatusBadge({ status }: { status: MemberStatus }) {
  return <span className={`badge badge-${status}`}><span className="dot" aria-hidden="true" />{STATUS_LABEL[status]}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.Close /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" /> Loading
    </div>
  );
}

export function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="error-box" role="alert"><Icon.Alert width={18} height={18} /> <span>{error}</span></div>;
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <span className="empty-icon">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

export function StatCard({ label, value, tone, sub, icon }: { label: string; value: ReactNode; tone?: string; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className={`stat ${tone ? 'stat-' + tone : ''}`}>
      <div className="stat-top"><span className="stat-label">{label}</span>{icon && <span className="stat-icon">{icon}</span>}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
