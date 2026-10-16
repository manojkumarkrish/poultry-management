'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'purple' | 'stage';
  stage?: 'chick' | 'grower' | 'layer' | 'completed';
  size?: 'sm' | 'md';
}

export default function Badge({
  children,
  variant = 'neutral',
  stage,
  size = 'sm',
}: BadgeProps) {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (stage) {
    switch (stage) {
      case 'chick':
        style = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'grower':
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'layer':
        style = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'completed':
        style = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
    }
  } else {
    switch (variant) {
      case 'success':
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        style = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'info':
        style = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'danger':
        style = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'purple':
        style = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      default:
        style = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style} ${sizeClass}`}
    >
      {children}
    </span>
  );
}
