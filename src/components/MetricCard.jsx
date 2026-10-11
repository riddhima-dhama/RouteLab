import React from 'react';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeType = 'cyan',
}) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <Icon size={16} />
            </div>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {title}
          </span>
        </div>

        {badgeText && (
          <span className={`badge badge-${badgeType}`} style={{ fontSize: '0.68rem' }}>
            {badgeText}
          </span>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.2,
            fontFamily: typeof value === 'string' && value.includes('→') ? 'var(--font-mono)' : 'inherit',
          }}
        >
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
