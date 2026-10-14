import React from 'react';

/**
 * Phone Handset Icon (Image 1)
 * Clean tilted phone handset outline
 */
export const PhoneIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/**
 * Incoming Call Icon (Image 2 from previous request)
 * Handset at bottom-left with incoming arrow pointing left (<-) at top-right
 */
export const IncomingCallIcon = ({ size = 18, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <line x1="22" y1="7" x2="12" y2="7" />
    <polyline points="16 3.5 12 7 16 10.5" />
    <g transform="translate(-1, 3) scale(0.82)">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </g>
  </svg>
);

/**
 * Outgoing Call Icon (Image 3 from previous request)
 * Handset at bottom-left with outgoing arrow pointing right (->) at top-right
 */
export const OutgoingCallIcon = ({ size = 18, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <line x1="12" y1="7" x2="22" y2="7" />
    <polyline points="18 3.5 22 7 18 10.5" />
    <g transform="translate(-1, 3) scale(0.82)">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </g>
  </svg>
);

/**
 * Search Icon (Image 4 from previous request)
 * Bold circular magnifying glass with thick diagonal stem
 */
export const SearchIcon = ({ size = 18, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <circle cx="10" cy="10" r="7" />
    <line x1="15.5" y1="15.5" x2="21.5" y2="21.5" />
  </svg>
);

/**
 * Video Call Icon
 * Video camera with rounded rectangle body and right lens cone
 */
export const VideoCallIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <rect x="2" y="5" width="13" height="14" rx="3.5" />
    <path d="M15 10l5.8-3.6A1 1 0 0 1 22 7.2v9.6a1 1 0 0 1-1.2.8l-5.8-3.6z" />
  </svg>
);

/**
 * Community / Members Icon (New Image 2)
 * 3-person silhouette bold outline matching user's exact design
 */
export const CommunityIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    {/* Center head */}
    <circle cx="12" cy="7.2" r="3.2" />
    {/* Center person shoulders and body */}
    <path d="M6 21v-1.6a4.4 4.4 0 0 1 4.4-4.4h3.2a4.4 4.4 0 0 1 4.4 4.4V21" />
    {/* Left person behind */}
    <path d="M5.3 10.2A2.8 2.8 0 0 1 3 7.5a2.8 2.8 0 0 1 3-2.8c.8 0 1.5.3 2 .8" />
    <path d="M1.5 20v-1a4 4 0 0 1 3-3.87" />
    {/* Right person behind */}
    <path d="M18.7 10.2a2.8 2.8 0 0 0 2.5-2.7 2.8 2.8 0 0 0-3-2.8c-.8 0-1.5.3-2 .8" />
    <path d="M22.5 20v-1a4 4 0 0 0-3-3.87" />
  </svg>
);

/**
 * Announcement Megaphone Icon (New Image 3)
 * Megaphone speaker with sound waves matching user's design
 */
export const AnnouncementIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    {/* Megaphone body */}
    <path d="M3 11v2a1.5 1.5 0 0 0 1.5 1.5H6l6 3.5V6L6 9.5H4.5A1.5 1.5 0 0 0 3 11z" />
    {/* Handle */}
    <path d="M7 14.5V19a1.5 1.5 0 0 0 1.5 1.5h1" />
    {/* Sound waves in front */}
    <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M19 7.5a6.5 6.5 0 0 1 0 9" />
  </svg>
);

/**
 * Circle Plus Icon (New Image 4)
 * Bold circle with clean plus symbol inside
 */
export const CirclePlusIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <circle cx="12" cy="12" r="9.5" />
    <line x1="12" y1="7.5" x2="12" y2="16.5" />
    <line x1="7.5" y1="12" x2="16.5" y2="12" />
  </svg>
);

/**
 * Pencil / Edit Icon (New Image 5)
 * Diagonal pencil with sharp tip and eraser matching user's design
 */
export const PencilIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    <line x1="15" y1="5" x2="19" y2="9" />
  </svg>
);

/**
 * Camera Icon (For Status Photo/Video update)
 * Bold rounded rectangle camera with circular lens
 */
export const CameraIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

/**
 * Gear / Settings Icon
 * Modern rounded outline gear icon for community settings
 */
export const GearIcon = ({ size = 18, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default {
  PhoneIcon,
  IncomingCallIcon,
  OutgoingCallIcon,
  SearchIcon,
  VideoCallIcon,
  CommunityIcon,
  AnnouncementIcon,
  CirclePlusIcon,
  PencilIcon,
  CameraIcon,
  GearIcon,
};
