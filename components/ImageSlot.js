"use client";

// 画像があれば表示、なければ「あとで差し込む」プレースホルダーを表示。
export default function ImageSlot({ src, label = "画像", hint }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label} className="slot-img" />;
  }
  return (
    <div className="slot-empty" role="img" aria-label={`${label}（未設定）`}>
      <div className="slot-icon">🖼️</div>
      <div className="slot-text">
        {label}をここに表示できます
        {hint ? <span className="slot-hint">{hint}</span> : null}
      </div>
    </div>
  );
}
