import React, { useState } from 'react';

const UserActivityChart = ({ data = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // If data is provided, use it; otherwise provide a neutral empty/starting curve
  const chartData = data && data.length > 0
    ? data
    : [
        { date: 'Day 1', activeUsers: 0, totalUsers: 0 },
        { date: 'Day 2', activeUsers: 0, totalUsers: 0 },
        { date: 'Day 3', activeUsers: 0, totalUsers: 0 },
        { date: 'Day 4', activeUsers: 0, totalUsers: 0 },
        { date: 'Day 5', activeUsers: 0, totalUsers: 0 },
        { date: 'Day 6', activeUsers: 0, totalUsers: 0 },
        { date: 'Today', activeUsers: 0, totalUsers: 0 },
      ];

  const width = 480;
  const height = 180;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 15;
  const paddingBottom = 26;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Dynamic maximum scale matching REAL data
  const highestValue = Math.max(
    ...chartData.map((d) => Math.max(Number(d.totalUsers) || 0, Number(d.activeUsers) || 0)),
    4
  );
  const maxVal = Math.max(4, Math.ceil(highestValue * 1.2));

  const getY = (val) => {
    const safeVal = Math.max(0, Number(val) || 0);
    return paddingTop + innerHeight - (safeVal / maxVal) * innerHeight;
  };

  const getX = (index) => {
    if (chartData.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * innerWidth;
  };

  const activePoints = chartData.map((d, i) => `${getX(i)},${getY(d.activeUsers)}`).join(' ');
  const totalPoints = chartData.map((d, i) => `${getX(i)},${getY(d.totalUsers)}`).join(' ');

  // SVG Area path for active users gradient
  const areaPath =
    `M ${getX(0)},${paddingTop + innerHeight} ` +
    chartData.map((d, i) => `L ${getX(i)},${getY(d.activeUsers)}`).join(' ') +
    ` L ${getX(chartData.length - 1)},${paddingTop + innerHeight} Z`;

  const formatNumberLabel = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
    return num.toString();
  };

  const yLabels = [
    { label: formatNumberLabel(Math.round(maxVal)), val: maxVal },
    { label: formatNumberLabel(Math.round(maxVal * 0.75)), val: maxVal * 0.75 },
    { label: formatNumberLabel(Math.round(maxVal * 0.5)), val: maxVal * 0.5 },
    { label: formatNumberLabel(Math.round(maxVal * 0.25)), val: maxVal * 0.25 },
    { label: '0', val: 0 },
  ];

  return (
    <div className="admin-chart-container" style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines and dynamic Y labels */}
        {yLabels.map((yl) => {
          const yPos = getY(yl.val);
          return (
            <g key={yl.label}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={yPos + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontWeight="500"
              >
                {yl.label}
              </text>
            </g>
          );
        })}

        {/* Shaded Area under active curve */}
        <path d={areaPath} fill="url(#activeGrad)" />

        {/* Total Users Line (Soft cyan/light blue) */}
        <polyline
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={totalPoints}
        />

        {/* Active Users Line (Deep vibrant blue) */}
        <polyline
          fill="none"
          stroke="#2563EB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={activePoints}
        />

        {/* Dots on active user curve */}
        {chartData.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.activeUsers);
          const isHovered = hoveredIndex === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill="#2563EB"
                stroke="#ffffff"
                strokeWidth={isHovered ? 2.5 : 2}
                style={{ transition: 'r 0.15s ease' }}
              />
              <circle cx={cx} cy={cy} r={14} fill="transparent" />
            </g>
          );
        })}

        {/* X-axis labels */}
        {chartData.map((d, i) => {
          const cx = getX(i);
          return (
            <text
              key={d.date || i}
              x={cx}
              y={height - 6}
              textAnchor="middle"
              fontSize="10.5"
              fill="#64748b"
              fontWeight="500"
            >
              {d.date}
            </text>
          );
        })}
      </svg>

      {/* Floating tooltip with REAL values */}
      {hoveredIndex !== null && chartData[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 15,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 3, marginBottom: 4 }}>
            {chartData[hoveredIndex].date}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
            Active Users: <b>{Number(chartData[hoveredIndex].activeUsers || 0).toLocaleString()}</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#93c5fd' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#93c5fd' }} />
            Total Registered: <b>{Number(chartData[hoveredIndex].totalUsers || 0).toLocaleString()}</b>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityChart;
