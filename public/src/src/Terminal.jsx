import React, { useState, useEffect, useRef, useMemo } from "react";
import { TrendingUp, TrendingDown, Radio, Search, Zap } from "lucide-react";

const FONT = "'JetBrains Mono','Consolas','Menlo',monospace";
const AMBER = "#ffa833";
const AMBER_DIM = "#8a5a1a";
const CYAN = "#5ce1f2";
const GREEN = "#1fe07a";
const RED = "#ff4d4d";
const WHITE = "#eceae2";
const DIM = "#6f6d63";
const BG = "#050503";
const PANEL_BG = "#0a0906";
const BORDER = "#242017";
const BORDER_SOFT = "#17140e";

const INIT_SYMBOLS = [
  { t: "AAPL", name: "APPLE INC", cat: "EQ", price: 232.15, vol: 48200000 },
  { t: "MSFT", name: "MICROSOFT CORP", cat: "EQ", price: 441.2, vol: 21300000 },
  { t: "GOOGL", name: "ALPHABET INC-A", cat: "EQ", price: 178.44, vol: 26100000 },
  { t: "AMZN", name: "AMAZON.COM INC", cat: "EQ", price: 198.32, vol: 33400000 },
  { t: "NVDA", name: "NVIDIA CORP", cat: "EQ", price: 138.67, vol: 195600000 },
  { t: "TSLA", name: "TESLA INC", cat: "EQ", price: 251.9, vol: 88200000 },
  { t: "META", name: "META PLATFORMS", cat: "EQ", price: 612.45, vol: 14700000 },
  { t: "JPM", name: "JPMORGAN CHASE", cat: "EQ", price: 231.1, vol: 9800000 },
  { t: "BTC-USD", name: "BITCOIN", cat: "CRYPTO", price: 96500, vol: 1200000000 },
  { t: "ETH-USD", name: "ETHEREUM", cat: "CRYPTO", price: 3400, vol: 680000000 },
  { t: "EUR/USD", name: "EURO SPOT", cat: "FX", price: 1.085, vol: 0 },
  { t: "XAU/USD", name: "GOLD SPOT", cat: "CMDTY", price: 2650.4, vol: 0 },
];

const INDICES = [
  { t: "SPX", price: 5850.2 },
  { t: "NDX", price: 20510.6 },
  { t: "DJI", price: 43210.9 },
  { t: "VIX", price: 14.2 },
  { t: "UKX", price: 8200.1 },
  { t: "NKY", price: 39510.3 },
];

const NEWS = [
  { tag: "TOP", h: "Fed officials signal patience on rate path amid mixed inflation data", m: "2" },
  { tag: "MKT", h: "Tech megacaps lead broad rally as yields ease off session highs", m: "6" },
  { tag: "TECH", h: "Chipmakers rise after strong datacenter demand commentary", m: "11" },
  { tag: "ECON", h: "Jobless claims come in below estimates, labor market steady", m: "18" },
  { tag: "CRYPTO", h: "Bitcoin holds above key level as ETF inflows continue", m: "24" },
  { tag: "MKT", h: "Dollar index little changed ahead of central bank speakers", m: "31" },
  { tag: "TOP", h: "Oil slips on demand concerns despite OPEC+ supply discipline", m: "37" },
  { tag: "EARN", h: "Retail earnings beat estimates as consumer spending stays resilient", m: "45" },
  { tag: "ECON", h: "Manufacturing PMI edges higher, first expansion in five months", m: "52" },
  { tag: "MKT", h: "Credit spreads tighten as risk appetite improves into month end", m: "58" },
];

function fmt(n, d = 2) {
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtVol(n) {
  if (!n) return "-";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
function tagColor(tag) {
  if (tag === "TOP") return RED;
  if (tag === "CRYPTO") return "#c77dff";
  if (tag === "TECH") return CYAN;
  return AMBER;
}
function sparkPath(history, w, h) {
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const stepX = w / (history.length - 1);
  return history
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function Terminal() {
  const [symbols, setSymbols] = useState(() =>
    INIT_SYMBOLS.map((s) => ({
      ...s,
      prevClose: s.price,
      changePct: 0,
      history: Array.from({ length: 40 }, () => s.price),
    }))
  );
  const [indices, setIndices] = useState(() => INDICES.map((i) => ({ ...i, prevClose: i.price, changePct: 0 })));
  const [selected, setSelected] = useState("AAPL");
  const [cmd, setCmd] = useState("");
  const [msg, setMsg] = useState("READY");
  const [panic, setPanic] = useState(false);
  const [clocks, setClocks] = useState({});
  const [pulse, setPulse] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setSymbols((prev) =>
        prev.map((s) => {
          const drift = (Math.random() - 0.5) * (s.cat === "CRYPTO" ? 0.006 : s.cat === "FX" ? 0.0008 : 0.003);
          const next = Math.max(0.01, s.price * (1 + drift));
          const hist = [...s.history.slice(-59), next];
          return {
            ...s,
            price: next,
            changePct: ((next - s.prevClose) / s.prevClose) * 100,
            history: hist,
            vol: s.vol ? s.vol + Math.round(Math.random() * 50000) : 0,
          };
        })
      );
      setIndices((prev) =>
        prev.map((i) => {
          const drift = (Math.random() - 0.5) * 0.002;
          const next = i.price * (1 + drift);
          return { ...i, price: next, changePct: ((next - i.prevClose) / i.prevClose) * 100 };
        })
      );
      setPulse((p) => !p);
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const zones = { NY: "America/New_York", LON: "Europe/London", TOK: "Asia/Tokyo", HKG: "Asia/Hong_Kong" };
      const out = {};
      Object.entries(zones).forEach(([k, tz]) => {
        out[k] = now.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      });
      setClocks(out);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const sel = symbols.find((s) => s.t === selected) || symbols[0];
  const selUp = sel.changePct >= 0;
  const selColor = selUp ? GREEN : RED;

  const movers = useMemo(() => {
    const sorted = [...symbols].sort((a, b) => b.changePct - a.changePct);
    return { gainers: sorted.slice(0, 3), losers: sorted.slice(-3).reverse() };
  }, [symbols]);

  function runCommand(raw) {
    const parts = raw.trim().toUpperCase().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return;
    const word = parts[0].replace("<GO>", "").replace("GO", "");
    const hit = symbols.find((s) => s.t === word);
    if (hit) {
      setSelected(hit.t);
      setMsg(`LOADED ${hit.t} — ${hit.name}`);
    } else if (word === "NEWS" || word === "TOP") {
      setMsg("TOP NEWS — SEE PANEL");
    } else if (word === "HELP") {
      setMsg("TRY: AAPL<GO>  NVDA<GO>  BTC-USD<GO>  NEWS<GO>");
    } else {
      setMsg(`INVALID SECURITY "${word}" — TYPE HELP<GO>`);
    }
    setCmd("");
  }

  function firePanic() {
    setPanic(true);
    setMsg("PANIC KEY — SCREEN RESET");
    setTimeout(() => setPanic(false), 1300);
  }

  const chartW = 640;
  const chartH = 220;
  const chartPath = useMemo(() => sparkPath(sel.history, chartW, chartH - 16), [sel.history]);
  const chartFill = useMemo(() => `${chartPath} L${chartW},${chartH} L0,${chartH} Z`, [chartPath]);

  return (
    <div
      style={{
        fontFamily: FONT,
        width: "100%",
        padding: 10,
        background: "linear-gradient(180deg,#1c1912,#0c0b08)",
        borderRadius: 14,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes dotpulse { 0%,100% { opacity:1; box-shadow:0 0 6px 1px rgba(31,224,122,0.7);} 50% { opacity:0.35; box-shadow:0 0 2px 0 rgba(31,224,122,0.2);} }
        @keyframes panicflash { 0%,100% { opacity:1; } 50% { opacity:0.55; } }
        .otrow:hover { background:#141009 !important; }
        .otfkey:hover { border-color:#5ce1f2 !important; color:#5ce1f2 !important; }
        .ot-scroll::-webkit-scrollbar { width:6px; }
        .ot-scroll::-webkit-scrollbar-thumb { background:#2a2517; }
        .ot-scroll::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <div
        style={{
          fontFamily: FONT,
          background: BG,
          color: WHITE,
          width: "100%",
          height: "880px",
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
          fontSize: 12,
          boxShadow: "0 0 0 1px #000, 0 20px 60px -20px rgba(255,168,51,0.08), inset 0 0 40px rgba(255,168,51,0.02)",
        }}
      >
        {panic && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(140,0,0,0.94)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 10,
              animation: "panicflash 0.25s steps(2) infinite",
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 6, color: "#fff" }}>PANIC</div>
            <div style={{ fontSize: 11, color: "#ffcccc", letterSpacing: 3 }}>SCREEN RESET IN PROGRESS</div>
          </div>
        )}

        {/* header */}
        <div
          style={{
            height: 42,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 18,
            background: `linear-gradient(180deg,${PANEL_BG},#060502)`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Zap size={14} color={AMBER} fill={AMBER} />
            <div style={{ color: AMBER, fontWeight: 700, letterSpacing: 3, fontSize: 13 }}>OPENTERM</div>
          </div>
          <div style={{ color: BORDER }}>│</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: GREEN }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, animation: "dotpulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ fontSize: 10, letterSpacing: 1.5 }}>LIVE · SIMULATED</span>
          </div>
          <div style={{ flex: 1 }} />
          {["NY", "LON", "TOK", "HKG"].map((z) => (
            <div key={z} style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
              <span style={{ color: DIM, fontSize: 9, letterSpacing: 1 }}>{z}</span>
              <span style={{ color: CYAN, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{clocks[z] || "--:--:--"}</span>
            </div>
          ))}
        </div>

        {/* index strip */}
        <div
          style={{
            height: 28,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "0 14px",
            background: "#020201",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {indices.map((i) => {
            const up = i.changePct >= 0;
            return (
              <div key={i.t} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                <span style={{ color: WHITE, fontSize: 10, fontWeight: 500 }}>{i.t}</span>
                <span style={{ color: DIM, fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{fmt(i.price, i.t === "VIX" ? 2 : 1)}</span>
                <span style={{ color: up ? GREEN : RED, fontSize: 10, fontVariantNumeric: "tabular-nums" }}>
                  {up ? "▲" : "▼"} {fmt(Math.abs(i.changePct), 2)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* command bar */}
        <div
          style={{
            height: 36,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 9,
            flexShrink: 0,
            background: "#080704",
          }}
        >
          <Search size={12} color={AMBER} />
          <input
            ref={inputRef}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCommand(cmd)}
            placeholder="TICKER <GO>  e.g. NVDA<GO>, NEWS<GO>, HELP<GO>"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: AMBER,
              fontFamily: FONT,
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          />
          <div style={{ color: DIM, fontSize: 10, maxWidth: 320, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {msg}
          </div>
        </div>

        {/* main grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "236px 1fr 264px", minHeight: 0 }}>
          {/* watchlist */}
          <div style={{ borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: "7px 12px", color: CYAN, fontSize: 10, letterSpacing: 1.5, borderBottom: `1px solid ${BORDER}`, background: PANEL_BG }}>
              WATCHLIST
            </div>
            <div className="ot-scroll" style={{ overflowY: "auto", flex: 1 }}>
              {symbols.map((s) => {
                const up = s.changePct >= 0;
                const isSel = s.t === selected;
                const color = up ? GREEN : RED;
                return (
                  <div
                    key={s.t}
                    className="otrow"
                    onClick={() => setSelected(s.t)}
                    style={{
                      padding: "7px 12px",
                      borderBottom: `1px solid ${BORDER_SOFT}`,
                      borderLeft: isSel ? `2px solid ${AMBER}` : "2px solid transparent",
                      cursor: "pointer",
                      background: isSel ? "#1a1200" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: isSel ? AMBER : WHITE, fontWeight: isSel ? 700 : 500 }}>{s.t}</span>
                        <span style={{ color, fontVariantNumeric: "tabular-nums" }}>{fmt(s.price, s.price > 1000 ? 0 : 2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, marginTop: 1 }}>
                        <span style={{ color: DIM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                        <span style={{ color, fontVariantNumeric: "tabular-nums" }}>
                          {up ? "+" : ""}
                          {fmt(s.changePct, 2)}%
                        </span>
                      </div>
                    </div>
                    <svg width="42" height="18" viewBox="0 0 42 18" style={{ flexShrink: 0, opacity: 0.9 }}>
                      <path d={sparkPath(s.history.slice(-16), 42, 18)} fill="none" stroke={color} strokeWidth="1.3" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>

          {/* center: chart */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0, borderRight: `1px solid ${BORDER}` }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, background: "linear-gradient(180deg,#0a0906,transparent)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ color: AMBER, fontSize: 17, fontWeight: 700, letterSpacing: 0.5 }}>{sel.t}</span>
                <span style={{ color: DIM, fontSize: 11 }}>{sel.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 5 }}>
                <span style={{ fontSize: 24, color: WHITE, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmt(sel.price, 2)}</span>
                <span style={{ color: selColor, display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                  {selUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {selUp ? "+" : ""}
                  {fmt(sel.price - sel.prevClose, 2)} ({selUp ? "+" : ""}
                  {fmt(sel.changePct, 2)}%)
                </span>
                <span style={{ color: DIM, fontSize: 10 }}>VOL {fmtVol(sel.vol)}</span>
              </div>
            </div>
            <div style={{ flex: 1, padding: "14px 16px 6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="100%" style={{ maxHeight: 260 }}>
                <defs>
                  <linearGradient id="fillgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={selColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={selColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1={0} x2={chartW} y1={chartH * f} y2={chartH * f} stroke="#151209" strokeWidth={1} />
                ))}
                <path d={chartFill} fill="url(#fillgrad)" stroke="none" />
                <path d={chartPath} fill="none" stroke={selColor} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: "9px 16px", background: "#080704" }}>
              <div style={{ color: CYAN, fontSize: 10, letterSpacing: 1.5, marginBottom: 7 }}>MARKET MOVERS</div>
              <div style={{ display: "flex", gap: 26 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: GREEN, fontSize: 9.5, marginBottom: 4, letterSpacing: 0.5 }}>TOP GAINERS</div>
                  {movers.gainers.map((m) => (
                    <div key={m.t} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 1 }}>
                      <span>{m.t}</span>
                      <span style={{ color: GREEN, fontVariantNumeric: "tabular-nums" }}>+{fmt(m.changePct, 2)}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: RED, fontSize: 9.5, marginBottom: 4, letterSpacing: 0.5 }}>TOP LOSERS</div>
                  {movers.losers.map((m) => (
                    <div key={m.t} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 1 }}>
                      <span>{m.t}</span>
                      <span style={{ color: RED, fontVariantNumeric: "tabular-nums" }}>{fmt(m.changePct, 2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* right: news */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: "7px 12px", color: CYAN, fontSize: 10, letterSpacing: 1.5, borderBottom: `1px solid ${BORDER}`, background: PANEL_BG }}>
              TOP NEWS
            </div>
            <div className="ot-scroll" style={{ overflowY: "auto", flex: 1 }}>
              {NEWS.map((n, idx) => (
                <div key={idx} className="otrow" style={{ padding: "8px 12px", borderBottom: `1px solid ${BORDER_SOFT}` }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ color: tagColor(n.tag), fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{n.tag}</span>
                    <span style={{ color: DIM, fontSize: 9 }}>{n.m}M AGO</span>
                  </div>
                  <div style={{ color: WHITE, fontSize: 11, lineHeight: 1.45 }}>{n.h}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ticker tape */}
        <div
          style={{
            height: 28,
            borderTop: `1px solid ${BORDER}`,
            overflow: "hidden",
            background: "#020201",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", whiteSpace: "nowrap", animation: "marquee 42s linear infinite" }}>
            {[...symbols, ...symbols].map((s, i) => {
              const up = s.changePct >= 0;
              return (
                <span key={i} style={{ marginRight: 30, fontSize: 11 }}>
                  <span style={{ color: WHITE, fontWeight: 500 }}>{s.t}</span>{" "}
                  <span style={{ color: up ? GREEN : RED, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(s.price, s.price > 1000 ? 0 : 2)} {up ? "▲" : "▼"} {fmt(Math.abs(s.changePct), 2)}%
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* function keys */}
        <div
          style={{
            height: 36,
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 6,
            background: PANEL_BG,
            flexShrink: 0,
          }}
        >
          {[
            ["F1", "HELP"],
            ["F2", "SECURITY"],
            ["F3", "NEWS"],
            ["F4", "CMDS"],
            ["F7", "GRAPH"],
            ["F8", "LIST"],
            ["F9", "GO"],
          ].map(([k, label]) => (
            <button
              key={k}
              className="otfkey"
              onClick={() => runCommand(label === "GO" ? cmd : label)}
              style={{
                background: "#0d0c08",
                border: `1px solid ${BORDER}`,
                color: DIM,
                fontFamily: FONT,
                fontSize: 9,
                padding: "5px 9px",
                cursor: "pointer",
                borderRadius: 3,
                transition: "color .15s,border-color .15s",
              }}
            >
              <span style={{ color: AMBER_DIM }}>{k}</span> {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={firePanic}
            style={{
              background: "#260404",
              border: `1px solid ${RED}`,
              color: RED,
              fontFamily: FONT,
              fontSize: 9,
              fontWeight: 700,
              padding: "5px 11px",
              cursor: "pointer",
              letterSpacing: 1,
              borderRadius: 3,
            }}
          >
            F12 PANIC!!
          </button>
        </div>
      </div>
    </div>
  );
}
