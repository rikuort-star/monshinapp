"use client";

import { useEffect, useRef, useState } from "react";
import PatientAvatar from "../components/PatientAvatar";
import ImageSlot from "../components/ImageSlot";
import { CASE } from "../lib/case.js";

const STAGES = [
  { key: "interview", label: "問診" },
  { key: "exam", label: "検査" },
  { key: "predict", label: "予測（鑑別）" },
  { key: "addtests", label: "追加検査" },
  { key: "result", label: "結果" },
];

const TOTAL_ITEMS = CASE.requiredItems.length;

function emotionFor(count, empathyTouched) {
  const ratio = count / TOTAL_ITEMS;
  if (ratio >= 0.85) return "happy";
  if (ratio >= 0.5) return "relieved";
  if (ratio >= 0.25 || empathyTouched) return "neutral";
  return "anxious";
}

// マイク/テキストの自由入力を、質問バンクの中から一番近い質問に当てはめる
function matchQuestion(text) {
  const t = (text || "").toLowerCase().replace(/\s/g, "");
  let best = null;
  let bestScore = 0;
  for (const item of CASE.questionBank) {
    let score = 0;
    for (const kw of item.keywords) {
      if (t.includes(kw.toLowerCase())) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore > 0 ? best : null;
}

export default function Page() {
  const [stage, setStage] = useState("intro");
  const [history, setHistory] = useState([]); // {role:'me'|'pt', content}
  const [emotion, setEmotion] = useState("anxious");
  const [bubble, setBubble] = useState(CASE.patient.chiefComplaint);
  const [askedIds, setAskedIds] = useState([]);
  const [elicited, setElicited] = useState([]);
  const [empathyTouched, setEmpathyTouched] = useState(false);
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");

  const [predictId, setPredictId] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [diagnoseId, setDiagnoseId] = useState(null);
  const [examVisited, setExamVisited] = useState(false);
  const [showChief, setShowChief] = useState(false);
  const [showExam, setShowExam] = useState(false);

  const recogRef = useRef(null);
  const logEndRef = useRef(null);
  const logBoxRef = useRef(null);
  const taRef = useRef(null);
  const composingRef = useRef(false);
  const correctDx = CASE.diagnoses.find((d) => d.correct);

  useEffect(() => { const el = logBoxRef.current; if (el) el.scrollTop = el.scrollHeight; }, [history]);
  useEffect(() => { if (stage === "exam") setExamVisited(true); }, [stage]);

  function clearInput() {
    setInput("");
    if (taRef.current) taRef.current.value = "";
  }

  function speak(text) {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP"; u.rate = 1.0; u.pitch = 1.05;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function ask(item, userText) {
    if (!item) return;
    const nextAsked = askedIds.includes(item.id) ? askedIds : [...askedIds, item.id];
    setAskedIds(nextAsked);

    let nextElicited = elicited;
    if (item.satisfies && !elicited.includes(item.satisfies)) {
      nextElicited = [...elicited, item.satisfies];
      setElicited(nextElicited);
    }
    let nextEmpathy = empathyTouched;
    if (item.empathy) { nextEmpathy = true; setEmpathyTouched(true); }

    const shown = (userText && userText.trim()) ? userText.trim() : item.q;
    setHistory((h) => [...h, { role: "me", content: shown }, { role: "pt", content: item.answer }]);
    setBubble(item.answer);
    clearInput();
    setEmotion(emotionFor(nextElicited.length, nextEmpathy));
    speak(item.answer);
  }

  function submitFreeText() {
    const text = input.trim();
    if (!text) return;
    const m = matchQuestion(text);
    clearInput();
    if (!m) {
      setToast("うまく聞き取れませんでした。別の言い方で試してみてください。");
      setTimeout(() => setToast(""), 3500);
      return;
    }
    ask(m, text);
  }

  function ensureRecog() {
    if (recogRef.current) return recogRef.current;
    if (typeof window === "undefined") return null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = "ja-JP"; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) {
        const m = matchQuestion(t);
        clearInput();
        if (m) ask(m, t);
        else { setToast("うまく聞き取れませんでした。別の言い方で試してみてください。"); setTimeout(() => setToast(""), 3500); }
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    return r;
  }

  function toggleMic() {
    const r = ensureRecog();
    if (!r) { alert("このブラウザは音声入力に未対応です（Chrome推奨）。ボタンかテキストで進めてください。"); return; }
    if (listening) { r.stop(); setListening(false); }
    else { setInput(""); try { r.start(); setListening(true); } catch {} }
  }

  function startInterview() {
    setStage("interview");
    setBubble(CASE.patient.chiefComplaint);
    setEmotion("anxious");
    setTimeout(() => speak(CASE.patient.chiefComplaint), 250);
  }

  function restart() {
    setStage("intro"); setHistory([]); setEmotion("anxious");
    setBubble(CASE.patient.chiefComplaint); setAskedIds([]); setElicited([]);
    setEmpathyTouched(false); setInput(""); setPredictId(null);
    setSelectedTests([]); setDiagnoseId(null);
    setExamVisited(false); setShowChief(false); setShowExam(false);
  }

  function goBack() {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (stage === "intro") return;
    const idx = STAGES.findIndex((s) => s.key === stage);
    if (idx <= 0) setStage("intro");
    else setStage(STAGES[idx - 1].key);
  }

  function toggleTest(id) {
    setSelectedTests((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  // ---- ルールベースのフィードバック（AI不要・無料） ----
  const missedItems = CASE.requiredItems.filter((r) => !elicited.includes(r.keyword));
  const score = Math.round((elicited.length / TOTAL_ITEMS) * 100);
  const advice = (() => {
    const a = [];
    if (missedItems.length === 0) a.push("必要な問診を網羅できています。この調子で、緊急度の判断（医師への報告）まで意識しましょう。");
    else {
      missedItems.slice(0, 2).forEach((m) => a.push(`次は「${m.label}」も忘れずに。${m.why}`));
      if (missedItems.length > 2) a.push("レッドフラッグ（飛蚊症の急増・光視症・視野欠損）は毎回ルーティンで確認する習慣を。");
    }
    if (!empathyTouched) a.push("不安をねぎらう一言があると、患者さんは話しやすくなります。");
    return a;
  })();

  const stageIndex = STAGES.findIndex((s) => s.key === stage);
  const remaining = CASE.questionBank.filter((q) => !askedIds.includes(q.id));
  const selectedTestObjs = CASE.additionalTests.filter((t) => selectedTests.includes(t.id));
  const commentGroups = CASE.testCommentGroups || [];
  const fullySelectedGroups = commentGroups.filter((g) => g.members.every((id) => selectedTests.includes(id)));
  const groupedIds = new Set(fullySelectedGroups.flatMap((g) => g.members));
  const examImages = CASE.examImages || (CASE.examImage !== undefined ? [{ label: "検査画像", src: CASE.examImage }] : []);

  // ---- 再利用パーツ：主訴パネル / 検査結果パネル / 表示切替バー ----
  const chiefPanelJSX = (
    <div className="review-panel">
      <div className="chief-line">「{CASE.patient.chiefComplaint}」</div>
      {CASE.patient.presentingHistory && CASE.patient.presentingHistory.length > 0 && (
        <ul className="history-list" style={{ marginTop: 8 }}>
          {CASE.patient.presentingHistory.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}
    </div>
  );

  // レフ・ケラト値の表（片眼分）を描画
  function refkeraEye(label, d) {
    if (!d) return null;
    return (
      <div style={{ marginBottom: 10 }}>
        <div className="rk-eye">{label}</div>
        <table className="rk-table">
          <thead>
            <tr><th></th><th>SPH</th><th>CYL</th><th>Axis</th><th>信頼</th></tr>
          </thead>
          <tbody>
            {d.ref.map((r, i) => (
              <tr key={i}><td>{r.n}</td><td>{r.sph}</td><td>{r.cyl}</td><td>{r.ax}</td><td>{r.c}</td></tr>
            ))}
            {d.refRep && (
              <tr className="rep"><td>代表</td><td>{d.refRep.sph}</td><td>{d.refRep.cyl}</td><td>{d.refRep.ax}</td><td></td></tr>
            )}
          </tbody>
        </table>
        {d.kerato && d.kerato.length > 0 && (
          <>
            <div className="rk-sub">ケラト値（代表値）</div>
            <table className="rk-table">
              <thead><tr><th></th><th>mm</th><th>D</th><th>deg</th></tr></thead>
              <tbody>
                {d.kerato.map((k, i) => (
                  <tr key={i}><td>{k.name}</td><td>{k.mm}</td><td>{k.d}</td><td>{k.deg}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {d.keratoError && <div className="rk-error">{d.keratoError}</div>}
      </div>
    );
  }

  const examBodyJSX = (
    <>
      {CASE.refkera && (
        <div className="refkera">
          <div className="refkera-title">レフ・ケラト値</div>
          {refkeraEye("右眼（R）", CASE.refkera.right)}
          {refkeraEye("左眼（L）", CASE.refkera.left)}
        </div>
      )}
      {examImages.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {examImages.map((im, i) => (
            <ImageSlot key={i} src={im.src} label={im.label}
              hint="public/images に置いて case.js の examImages に指定" />
          ))}
        </div>
      )}
      {CASE.visionTable && CASE.visionTable.length > 0 && (
        <div className="vision">
          <div className="vision-title rounded">視力</div>
          {CASE.visionTable.map((v, i) => (
            <div className="vision-row" key={i}>
              <span className="vision-eye">{v.eye}</span>
              <span className="vision-val">{v.value}</span>
              {v.note && <span className="vision-note">{v.note}</span>}
            </div>
          ))}
        </div>
      )}
      <table className="exam">
        <tbody>
          {CASE.examResults.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td className={r.flag === "abnormal" ? "flag-abn" : "flag-norm"}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  // 主訴／検査結果を、どの画面からでも開閉できる表示切替セクション
  const reviewSection = (
    <div className="review">
      <div className="reviewbar">
        <button className="navbtn" onClick={() => setShowChief((v) => !v)}>
          📋 主訴{showChief ? "を隠す" : "を見る"}
        </button>
        {examVisited && (
          <button className="navbtn" onClick={() => setShowExam((v) => !v)}>
            🔬 検査結果{showExam ? "を隠す" : "を見る"}
          </button>
        )}
      </div>
      {showChief && <div style={{ marginTop: 10 }}>{chiefPanelJSX}</div>}
      {showExam && <div style={{ marginTop: 10 }}>{examBodyJSX}</div>}
    </div>
  );

  return (
    <main className="app">
      <div className="topbar">
        {stage !== "intro" && (
          <div className="nav">
            <button className="navbtn" onClick={goBack}>← 戻る</button>
            <button className="navbtn" onClick={restart}>🏠 最初へ</button>
          </div>
        )}
        <h1 className="rounded">👁 問診トレーニング</h1>
        <p>視能訓練士のための・患者と話して学ぶ臨床推論</p>
        {stage !== "intro" && (
          <div className="stages">
            {STAGES.map((s, i) => (
              <span key={s.key} className={`stage-dot ${s.key === stage ? "active" : i < stageIndex ? "done" : ""}`}>
                {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ---------- INTRO ---------- */}
      {stage === "intro" && (
        <div className="card">
          <div className="scene" style={{ marginBottom: 16 }}>
            {CASE.patient.image
              ? <ImageSlot src={CASE.patient.image} label="患者" />
              : <div className="avatar-wrap"><PatientAvatar emotion="anxious" size={170} /></div>}
            <span className="patient-name rounded">{CASE.patient.name}</span>
            <div className="bubble">{CASE.patient.chiefComplaint}</div>
          </div>
          <h2 className="rounded">今日の患者さん</h2>
          <p className="muted">{CASE.title}</p>
          {CASE.patient.presentingHistory && CASE.patient.presentingHistory.length > 0 && (
            <div className="history">
              <div className="history-title rounded">患者さんからの情報</div>
              <ul className="history-list">
                {CASE.patient.presentingHistory.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}
          <p className="muted" style={{ marginTop: 12 }}>
            {CASE.hideQuestionButtons
              ? "主訴をもとに、🎤マイクか入力欄から自分で質問を考えて問診してください。"
              : "主訴をもとに問診を始めましょう。質問はボタンで選ぶか🎤マイクで話せます。"}
            患者さんの返事は自動で読み上げられます。要点を聞き出すほど表情が明るくなります。
          </p>
          <p className="hint" style={{ marginTop: 10 }}>※鑑別を考える臨床推論の練習です（確定診断は医師が行います）</p>
          <button className="btn primary block" style={{ marginTop: 14 }} onClick={startInterview}>問診をはじめる</button>
        </div>
      )}

      {/* ---------- INTERVIEW ---------- */}
      {stage === "interview" && (
        <>
          {reviewSection}
          <div className="scene">
            {CASE.patient.image
              ? <ImageSlot src={CASE.patient.image} label="患者" />
              : <div className="avatar-wrap"><PatientAvatar emotion={emotion} size={150} /></div>}
            <span className="patient-name rounded">{CASE.patient.name}</span>
            <div className="bubble">{bubble}</div>
            {!CASE.hideQuestionButtons && (
              <div className="chips">
                {CASE.requiredItems.map((r) => (
                  <span key={r.keyword} className={`chip ${elicited.includes(r.keyword) ? "hit" : ""}`}>
                    {elicited.includes(r.keyword) ? "✓ " : ""}{r.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            {history.length > 0 && (
              <div className="log" ref={logBoxRef}>
                {history.map((m, i) => (
                  <div key={i} className={`row ${m.role === "me" ? "me" : ""}`}>
                    <div className={`msg ${m.role === "me" ? "me" : "pt"}`}>{m.content}</div>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}

            <div className="composer">
              <button className={`mic ${listening ? "on" : ""}`} onClick={toggleMic} aria-label="音声入力" title="音声で話す">🎤</button>
              <textarea
                ref={taRef}
                value={input}
                placeholder={listening ? "聞き取り中…" : "質問を話す/入力する"}
                onChange={(e) => setInput(e.target.value)}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={() => { composingRef.current = false; }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (e.nativeEvent.isComposing || composingRef.current || e.keyCode === 229) return;
                    e.preventDefault();
                    submitFreeText();
                  }
                }}
              />
              <button className="send" onClick={submitFreeText} aria-label="送信">➤</button>
            </div>
            {toast && <div className="toast">{toast}</div>}

            {!CASE.hideQuestionButtons && (
              <div className="qbank">
                <div className="qbank-title rounded">質問を選ぶ（残り {remaining.length}）</div>
                <div className="qbtns">
                  {remaining.map((q) => (
                    <button key={q.id} className={`qbtn ${q.empathy ? "emp" : ""}`} onClick={() => ask(q)}>{q.q}</button>
                  ))}
                  {remaining.length === 0 && <p className="muted">ひと通り聞けました。検査に進みましょう。</p>}
                </div>
              </div>
            )}
            {CASE.hideQuestionButtons && (
              <p className="hint" style={{ marginTop: 10, textAlign: "left" }}>
                マイク、または入力欄から、自分で質問を考えて聞いてみましょう（質問の例は表示されません）。あいさつなど簡単な日常会話もできます。
              </p>
            )}

            <div className="btn-row">
              <button className="btn ghost" onClick={() => setMuted((m) => !m)}>{muted ? "🔇 音声オフ" : "🔊 音声オン"}</button>
              <button className="btn coral" style={{ flex: 1 }} onClick={() => setStage("exam")}>問診を終えて検査へ →</button>
            </div>
          </div>
        </>
      )}

      {/* ---------- EXAM ---------- */}
      {stage === "exam" && (
        <div className="card">
          <h2 className="rounded">🔬 検査結果</h2>
          <div className="reviewbar" style={{ marginBottom: 12 }}>
            <button className="navbtn" onClick={() => setShowChief((v) => !v)}>
              📋 主訴{showChief ? "を隠す" : "を見る"}
            </button>
          </div>
          {showChief && <div style={{ marginBottom: 12 }}>{chiefPanelJSX}</div>}
          {examBodyJSX}
          <p className="muted" style={{ marginTop: 12 }}>問診と検査所見から、どの疾患が疑わしいでしょうか。もう少し聞きたいことがあれば、追加で問診もできます。</p>
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setStage("interview")}>🗣 追加で問診する</button>
            <button className="btn primary" style={{ flex: 1 }} onClick={() => setStage("predict")}>疾患を予測する →</button>
          </div>
        </div>
      )}

      {/* ---------- PREDICT ---------- */}
      {stage === "predict" && (
        <div className="card">
          {reviewSection}
          <h2 className="rounded">🤔 考えられる疾患（鑑別）は？</h2>
          <p className="hint" style={{ textAlign: "left", marginBottom: 12 }}>※鑑別を考える臨床推論の練習です（確定診断は医師が行います）</p>
          <div className="options">
            {CASE.diagnoses.map((d) => (
              <button key={d.id} className={`opt ${predictId === d.id ? "sel" : ""}`} onClick={() => setPredictId(d.id)}>
                <span className="tick">{predictId === d.id ? "✓" : ""}</span>{d.name}
              </button>
            ))}
          </div>
          <button className="btn primary block" style={{ marginTop: 14 }} disabled={!predictId} onClick={() => setStage("addtests")}>追加検査を決める →</button>
        </div>
      )}

      {/* ---------- ADD TESTS ---------- */}
      {stage === "addtests" && (
        <div className="card">
          {reviewSection}
          <h2 className="rounded">🧪 必要な追加検査を選ぶ</h2>
          <p className="hint" style={{ textAlign: "left", marginBottom: 12 }}>鑑別を確かめるために必要な検査を選択（複数可）。</p>
          <div className="options">
            {CASE.additionalTests.map((t) => (
              <div key={t.id}>
                <button className={`opt ${selectedTests.includes(t.id) ? "sel" : ""}`} onClick={() => toggleTest(t.id)}>
                  <span className="tick">{selectedTests.includes(t.id) ? "✓" : ""}</span><span>{t.name}</span>
                </button>
                {selectedTests.includes(t.id) && t.recommended && t.images && (
                  <div className="test-result">
                    {t.images.map((im, i) => (
                      <div key={i} style={{ margin: "8px 0" }}>
                        <ImageSlot src={im.src} label={im.label}
                          hint="public/images に置いて case.js の該当テストの images に指定" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="btn primary block" style={{ marginTop: 14 }} disabled={selectedTests.length === 0} onClick={() => setStage("result")}>結果を見る →</button>
          <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setStage("predict")}>← 追加検査の検査結果を踏まえて予測（鑑別）へ戻る</button>
        </div>
      )}

      {/* ---------- RESULT ---------- */}
      {stage === "result" && (
        <>
          {reviewSection}
          <div className="card">
            {(() => {
              const ok = predictId === correctDx.id;
              return (
                <div className={`verdict ${ok ? "ok" : "ng"}`}>
                  <div className="big rounded">{ok ? "正解！🎉" : "おしい！"}</div>
                  <p className="muted" style={{ marginTop: 4 }}>あなたの選択：{CASE.diagnoses.find((d) => d.id === predictId)?.name}</p>
                </div>
              );
            })()}
            {CASE.explanation.image && (
              <div style={{ margin: "10px 0" }}>
                <ImageSlot src={CASE.explanation.image} label="解説図"
                  hint="public/images に置いて case.js の explanation.image に指定" />
              </div>
            )}
            {CASE.explanation.images && CASE.explanation.images.map((im, i) => (
              <div key={i} style={{ margin: "10px 0" }}>
                <ImageSlot src={im.src} label={im.label}
                  hint="public/images に置いて case.js の explanation.images に指定" />
                {im.caption && <p className="muted" style={{ marginTop: 6, fontSize: 12.5 }}>{im.caption}</p>}
              </div>
            ))}
            <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>
              <b className="rounded">医師の確定診断：{CASE.explanation.answerName}</b><br />
              {CASE.explanation.summary}
            </p>
            <div className="fb-block">
              <h3>📌 この症例の学びどころ</h3>
              <ul className="fb-list">{CASE.explanation.teachingPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
            <div className="fb-block">
              <h3>🔀 鑑別のポイント</h3>
              {(CASE.explanation.differentialNotes || [CASE.explanation.differentialNote]).map((p, i) => (
                <p className="muted" key={i} style={{ marginTop: i ? 10 : 0 }}>{p}</p>
              ))}
            </div>

            {selectedTestObjs.length > 0 && (
              <div className="fb-block">
                <h3>🧪 選んだ追加検査について</h3>

                {selectedTestObjs.filter((t) => t.recommended).map((t) => (
                  <div key={t.id} style={{ marginBottom: 12 }}>
                    <b className="rounded">{t.name}</b><span className="muted">（推奨）</span>
                    {t.resultNote && <p className="muted" style={{ marginTop: 4 }}>{t.resultNote}</p>}
                    {t.image !== undefined && (
                      <div style={{ marginTop: 8 }}>
                        <ImageSlot src={t.image} label={`${t.name}の結果画像`}
                          hint="public/images に置いて case.js の該当テストの image に指定" />
                      </div>
                    )}
                  </div>
                ))}

                {fullySelectedGroups.map((g, gi) => {
                  const names = g.members
                    .map((id) => CASE.additionalTests.find((t) => t.id === id)?.name)
                    .filter(Boolean).join("・");
                  return (
                    <div key={`grp${gi}`} style={{ marginBottom: 12 }}>
                      <b className="rounded">{names}</b><span className="muted">（優先度は低め）</span>
                      <p className="muted" style={{ marginTop: 4 }}>{g.comment}</p>
                    </div>
                  );
                })}

                {selectedTestObjs.filter((t) => !t.recommended && !groupedIds.has(t.id)).map((t) => (
                  <div key={t.id} style={{ marginBottom: 12 }}>
                    <b className="rounded">{t.name}</b><span className="muted">（優先度は低め）</span>
                    {t.comment && <p className="muted" style={{ marginTop: 4 }}>{t.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="rounded">📝 あなたの問診へのフィードバック</h2>
            <div className="score-ring rounded">{score}<span style={{ fontSize: 16 }}> / 100</span></div>
            <p className="muted" style={{ textAlign: "center" }}>必須 {TOTAL_ITEMS} 項目中 {elicited.length} 項目を聞き出せました</p>

            {elicited.length > 0 && (
              <div className="fb-block">
                <h3>👍 聞けていた点</h3>
                <ul className="fb-list good">
                  {CASE.requiredItems.filter((r) => elicited.includes(r.keyword)).map((r) => <li key={r.keyword}>{r.label}</li>)}
                </ul>
              </div>
            )}
            {missedItems.length > 0 && (
              <div className="fb-block">
                <h3>🔎 聞けていなかった点</h3>
                <ul className="fb-list miss">{missedItems.map((r) => <li key={r.keyword}><b>{r.label}</b>：{r.why}</li>)}</ul>
              </div>
            )}
            <div className="fb-block">
              <h3>💡 次回へのアドバイス</h3>
              <ul className="fb-list adv">{advice.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
            <button className="btn primary block" style={{ marginTop: 16 }} onClick={restart}>もう一度やる</button>
          </div>

          {CASE.appendix && (
            <div className="card">
              <h2 className="rounded">📎 {CASE.appendix.title}</h2>
              {CASE.appendix.image !== undefined && (
                <div style={{ margin: "10px 0" }}>
                  <ImageSlot src={CASE.appendix.image} label="付録の画像"
                    hint="public/images に置いて case.js の appendix.image に指定" />
                </div>
              )}
              <p className="muted">{CASE.appendix.note}</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
