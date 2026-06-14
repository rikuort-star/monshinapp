"use client";

// 表情が変わる患者アバター（SVG・超軽量）
// emotion: "anxious" | "neutral" | "relieved" | "happy"
export default function PatientAvatar({ emotion = "anxious", size = 200 }) {
  const faces = {
    anxious: {
      blush: 0,
      brow: <>
        <path d="M58 78 q12 -8 24 0" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M118 78 q12 -8 24 0" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>,
      eyes: <>
        <ellipse cx="72" cy="98" rx="9" ry="11" fill="#3a3a3a" />
        <ellipse cx="128" cy="98" rx="9" ry="11" fill="#3a3a3a" />
        <circle cx="69" cy="94" r="3" fill="#fff" />
        <circle cx="125" cy="94" r="3" fill="#fff" />
      </>,
      mouth: <path d="M82 138 q18 -10 36 0" stroke="#7a4a4a" strokeWidth="4" fill="none" strokeLinecap="round" />,
      sweat: <path d="M150 86 q6 10 0 16 q-6 -6 0 -16Z" fill="#8fd3e8" opacity="0.9" />,
    },
    neutral: {
      blush: 0.25,
      brow: <>
        <path d="M58 80 q12 -3 24 0" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M118 80 q12 -3 24 0" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>,
      eyes: <>
        <circle cx="72" cy="100" r="9" fill="#3a3a3a" />
        <circle cx="128" cy="100" r="9" fill="#3a3a3a" />
        <circle cx="69" cy="96" r="3" fill="#fff" />
        <circle cx="125" cy="96" r="3" fill="#fff" />
      </>,
      mouth: <path d="M86 140 h28" stroke="#7a4a4a" strokeWidth="4" fill="none" strokeLinecap="round" />,
      sweat: null,
    },
    relieved: {
      blush: 0.55,
      brow: <>
        <path d="M58 78 q12 -2 24 1" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M118 79 q12 -3 24 0" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>,
      eyes: <>
        <path d="M63 100 q9 8 18 0" stroke="#3a3a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M119 100 q9 8 18 0" stroke="#3a3a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>,
      mouth: <path d="M84 136 q16 12 32 0" stroke="#7a4a4a" strokeWidth="4" fill="none" strokeLinecap="round" />,
      sweat: null,
    },
    happy: {
      blush: 0.8,
      brow: <>
        <path d="M58 74 q12 -3 24 0" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M118 74 q12 -3 24 0" stroke="#6b5a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>,
      eyes: <>
        <path d="M62 98 q10 10 20 0" stroke="#3a3a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M118 98 q10 10 20 0" stroke="#3a3a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>,
      mouth: <path d="M80 134 q20 22 40 0" stroke="#7a4a4a" strokeWidth="4" fill="#fff5f0" strokeLinecap="round" />,
      sweat: null,
    },
  };

  const f = faces[emotion] || faces.neutral;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`患者の表情: ${emotion}`}
      style={{ display: "block", transition: "transform .3s ease" }}
    >
      {/* 頭・顔の輪郭 */}
      <circle cx="100" cy="105" r="78" fill="#ffe1c4" stroke="#f0c9a4" strokeWidth="3" />
      {/* 髪（さわやかな短髪） */}
      <path d="M30 90 q3 -56 70 -58 q67 2 70 58 q-15 -27 -70 -27 q-55 0 -70 27Z" fill="#4a3f36" />
      <path d="M96 38 q-24 6 -32 26 q20 -12 40 -11 q-4 -9 -8 -15Z" fill="#5a4d42" opacity="0.55" />
      {/* ほっぺ */}
      <circle cx="58" cy="120" r="12" fill="#ff9a8b" opacity={f.blush} />
      <circle cx="142" cy="120" r="12" fill="#ff9a8b" opacity={f.blush} />
      {f.brow}
      {f.eyes}
      {f.mouth}
      {f.sweat}
    </svg>
  );
}
