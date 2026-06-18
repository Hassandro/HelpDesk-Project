import React from 'react';

const svg = (size, color, children) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const InboxIcon       = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
</>);

export const CheckCircleIcon = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
  <polyline points="22 4 12 14.01 9 11.01"/>
</>);

export const TrendingUpIcon  = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
  <polyline points="17 6 23 6 23 12"/>
</>);

export const BookOpenIcon    = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
</>);

export const TagIcon         = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
  <line x1="7" y1="7" x2="7.01" y2="7"/>
</>);

export const CircleIcon      = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <circle cx="12" cy="12" r="10"/>
</>);

export const ClockIcon       = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</>);

export const ArchiveIcon     = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <polyline points="21 8 21 21 3 21 3 8"/>
  <rect x="1" y="3" width="22" height="5"/>
  <line x1="10" y1="12" x2="14" y2="12"/>
</>);

export const PlusCircleIcon  = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" y1="8" x2="12" y2="16"/>
  <line x1="8" y1="12" x2="16" y2="12"/>
</>);

export const BarChartIcon    = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <line x1="18" y1="20" x2="18" y2="10"/>
  <line x1="12" y1="20" x2="12" y2="4"/>
  <line x1="6" y1="20" x2="6" y2="14"/>
</>);

export const UsersIcon       = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</>);

export const FileTextIcon    = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
  <polyline points="10 9 9 9 8 9"/>
</>);

export const AlertCircleIcon = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" y1="8" x2="12" y2="12"/>
  <line x1="12" y1="16" x2="12.01" y2="16"/>
</>);

export const MailIcon        = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
  <polyline points="22,6 12,13 2,6"/>
</>);

export const LogOutIcon      = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</>);

export const UserIcon        = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</>);

export const RefreshIcon     = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <polyline points="23 4 23 10 17 10"/>
  <polyline points="1 20 1 14 7 14"/>
  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
</>);

export const PaperclipIcon   = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
</>);

export const BellIcon        = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
</>);

export const MessageSquareIcon = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
</>);

export const LockIcon        = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</>);

export const Trash2Icon      = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  <line x1="10" y1="11" x2="10" y2="17"/>
  <line x1="14" y1="11" x2="14" y2="17"/>
</>);

export const PlusIcon        = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</>);

export const PencilIcon      = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
</>);

export const CheckIcon       = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <polyline points="20 6 9 17 4 12"/>
</>);

export const RotateCcwIcon   = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <polyline points="1 4 1 10 7 10"/>
  <path d="M3.51 15a9 9 0 1 0 .49-3.07"/>
</>);

export const PinIcon         = ({ size = 16, color = 'currentColor' }) => svg(size, color, <>
  <line x1="12" y1="17" x2="12" y2="22"/>
  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
</>);
