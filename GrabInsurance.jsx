import React, { useState, useEffect, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const INSURANCE_CATALOG = [
  { id: "TI_CANCEL", name: "Trip Cancellation Cover", category: "travel", icon: "✈️", baseRate: 0.008, desc: "Covers non-refundable costs if you cancel" },
  { id: "TI_MEDICAL", name: "Travel Medical Insurance", category: "travel", icon: "🏥", baseRate: 0.006, desc: "Medical emergencies while travelling" },
  { id: "EW_EXTENDED", name: "Electronics Extended Warranty", category: "electronics", icon: "🔧", baseRate: 0.04, desc: "Extend your manufacturer warranty by 1 year" },
  { id: "EW_SCREEN", name: "Screen Damage Protection", category: "electronics", icon: "📱", baseRate: 0.025, desc: "Accidental screen damage and drops" },
  { id: "PA_FOOD", name: "Personal Accident Cover", category: "food", icon: "🛵", baseRate: 12, desc: "Personal accident during food delivery" },
  { id: "HE_OPD", name: "Health OPD Cover", category: "health", icon: "💊", baseRate: 0.015, desc: "Outpatient consultations and diagnostics" },
  { id: "TI_RETURN", name: "Return Journey Protection", category: "travel", icon: "🔄", baseRate: 0.005, desc: "Covers missed connections and rebooking" },
  { id: "PP_PURCHASE", name: "Purchase Protection", category: "general", icon: "🛡️", baseRate: 0.012, desc: "Theft or damage within 30 days of purchase" },
];

const MOCK_DEALS = [
  { id: "D001", merchant: "MakeMyTrip", category: "travel", subcategory: "flight", dealValue: 12400, dealLabel: "Goa Round Trip", logo: "✈️", color: "#FF6B35" },
  { id: "D002", merchant: "Myntra", category: "fashion", subcategory: "clothing", dealValue: 2800, dealLabel: "Summer Collection", logo: "👗", color: "#9B59B6" },
  { id: "D003", merchant: "Samsung", category: "electronics", subcategory: "smartphone", dealValue: 45000, dealLabel: "Galaxy S24 FE", logo: "📱", color: "#1A73E8" },
  { id: "D004", merchant: "Swiggy", category: "food", subcategory: "delivery", dealValue: 350, dealLabel: "Weekend Feast", logo: "🍔", color: "#FC8019" },
  { id: "D005", merchant: "Nykaa", category: "health", subcategory: "skincare", dealValue: 1200, dealLabel: "Skincare Bundle", logo: "✨", color: "#E91E8C" },
  { id: "D006", merchant: "OYO", category: "travel", subcategory: "hotel", dealValue: 3600, dealLabel: "Weekend Getaway", logo: "🏨", color: "#EE2A24" },
  { id: "D007", merchant: "Boat", category: "electronics", subcategory: "audio", dealValue: 4499, dealLabel: "Airdopes 141", logo: "🎧", color: "#00C4CC" },
  { id: "D008", merchant: "Zomato", category: "food", subcategory: "dining", dealValue: 800, dealLabel: "Fine Dine Offer", logo: "🍽️", color: "#E23744" },
  { id: "D009", merchant: "Pharmeasy", category: "health", subcategory: "medicine", dealValue: 600, dealLabel: "Medicines + Lab Tests", logo: "💊", color: "#00897B" },
  { id: "D010", merchant: "MakeMyTrip", category: "travel", subcategory: "holiday", dealValue: 89000, dealLabel: "Europe 10N Package", logo: "🌍", color: "#FF6B35" },
];

const USER_PERSONAS = [
  { id: "U001", name: "Priya Sharma", riskTier: "low", purchaseHistory: ["fashion", "health"], frequencyScore: 8.2 },
  { id: "U002", name: "Arjun Mehta", riskTier: "medium", purchaseHistory: ["electronics", "food"], frequencyScore: 5.1 },
  { id: "U003", name: "Kavitha Nair", riskTier: "low", purchaseHistory: ["travel", "fashion"], frequencyScore: 9.0 },
];

const COPY_STRATEGIES = ["urgency", "value", "social_proof"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function classifyIntent(deal) {
  // Smart confidence scoring based on category + subcategory + deal value
  const intentMap = {
    travel: {
      flight:   [{ id: "TI_CANCEL", confidence: 0.94 }, { id: "TI_MEDICAL", confidence: 0.81 }],
      hotel:    [{ id: "TI_CANCEL", confidence: 0.78 }, { id: "TI_RETURN",  confidence: 0.72 }],
      holiday:  [{ id: "TI_CANCEL", confidence: 0.96 }, { id: "TI_MEDICAL", confidence: 0.88 }],
      default:  [{ id: "TI_CANCEL", confidence: 0.82 }, { id: "TI_MEDICAL", confidence: 0.69 }],
    },
    electronics: {
      smartphone: [{ id: "EW_SCREEN",   confidence: 0.92 }, { id: "EW_EXTENDED", confidence: 0.76 }],
      audio:      [{ id: "EW_EXTENDED", confidence: 0.83 }, { id: "EW_SCREEN",   confidence: 0.58 }],
      default:    [{ id: "EW_EXTENDED", confidence: 0.79 }, { id: "EW_SCREEN",   confidence: 0.66 }],
    },
    food: {
      delivery:   [{ id: "PA_FOOD",     confidence: 0.88 }, { id: "PP_PURCHASE", confidence: 0.52 }],
      dining:     [{ id: "PA_FOOD",     confidence: 0.71 }, { id: "PP_PURCHASE", confidence: 0.48 }],
      default:    [{ id: "PA_FOOD",     confidence: 0.75 }, { id: "PP_PURCHASE", confidence: 0.50 }],
    },
    health: {
      medicine:   [{ id: "HE_OPD",      confidence: 0.91 }, { id: "PP_PURCHASE", confidence: 0.63 }],
      skincare:   [{ id: "PP_PURCHASE", confidence: 0.74 }, { id: "HE_OPD",      confidence: 0.55 }],
      default:    [{ id: "HE_OPD",      confidence: 0.80 }, { id: "PP_PURCHASE", confidence: 0.60 }],
    },
    fashion: {
      clothing:   [{ id: "PP_PURCHASE", confidence: 0.77 }, { id: "TI_RETURN",   confidence: 0.61 }],
      default:    [{ id: "PP_PURCHASE", confidence: 0.70 }, { id: "TI_RETURN",   confidence: 0.55 }],
    },
    general: {
      default:    [{ id: "PP_PURCHASE", confidence: 0.65 }, { id: "HE_OPD",      confidence: 0.50 }],
    },
  };

  const categoryMap = intentMap[deal.category] || intentMap.general;
  const matches = categoryMap[deal.subcategory] || categoryMap.default;

  // Boost confidence for high-value deals — more to lose = more relevant insurance
  const valueBoost = deal.dealValue > 10000 ? 0.04 : deal.dealValue > 3000 ? 0.02 : 0;

  return matches.map(({ id, confidence }) => ({
    product: INSURANCE_CATALOG.find(p => p.id === id),
    confidence: Math.min(0.99, confidence + valueBoost),
  }));
}

// ─── MOCK PRICING API ────────────────────────────────────────────────────────
// Simulates a real insurance pricing API call (e.g. POST /api/insurance/quote)
// In production this would call an actual insurance partner's pricing endpoint
async function fetchPremiumQuote(product, deal, user) {
  if (!product) return 0;

  // Simulate network latency of a real pricing API (4–5s)
  await new Promise(res => setTimeout(res, 4000 + Math.random() * 1000));

  // Pricing engine logic (mirrors what a real underwriting API would compute)
  const tierMult = user.riskTier === "low" ? 0.85 : user.riskTier === "medium" ? 1.0 : 1.2;

  // Category-based loading factors (risk adjustments per insurance type)
  const categoryLoading = {
    travel: 1.10,      // travel has higher claim frequency
    electronics: 1.05,
    food: 0.95,
    health: 1.15,      // health claims are expensive
    fashion: 0.90,
    general: 1.00,
  };
  const loading = categoryLoading[deal.category] || 1.0;

  let raw;
  if (product.baseRate > 10) {
    raw = product.baseRate * tierMult * loading;
  } else {
    raw = deal.dealValue * product.baseRate * tierMult * loading;
  }

  return Math.max(29, Math.round(raw));
}

// Synchronous version kept for places that can't use async (copy generation)
function calcPremium(product, deal, user) {
  if (!product) return 0;
  const tierMult = user.riskTier === "low" ? 0.85 : user.riskTier === "medium" ? 1.0 : 1.2;
  const categoryLoading = { travel: 1.10, electronics: 1.05, food: 0.95, health: 1.15, fashion: 0.90, general: 1.00 };
  const loading = categoryLoading[deal.category] || 1.0;
  if (product.baseRate > 10) return Math.round(product.baseRate * tierMult * loading);
  const raw = deal.dealValue * product.baseRate * tierMult * loading;
  return Math.max(29, Math.round(raw));
}

function generateCopy(deal, product, strategy, premium) {
  if (!product) return "";
  const templates = {
    urgency: {
      travel: `Your ₹${deal.dealValue.toLocaleString("en-IN")} ${deal.dealLabel} trip. Secure it now for ₹${premium}. Offer ends at checkout.`,
      electronics: `Protect your new ${deal.merchant} device — screen cover for just ₹${premium}. Limited slots today.`,
      food: `Order with confidence. Personal accident cover added for ₹${premium}. Expires at checkout.`,
      health: `Your health deserves backup. OPD cover for ₹${premium} — activate before completing purchase.`,
      default: `One-tap protection for ₹${premium}. Don't miss it — expires with this session.`,
    },
    value: {
      travel: `Your ₹${deal.dealValue.toLocaleString("en-IN")} ${deal.dealLabel}. Protect it for ₹${premium} — that's ${((premium / deal.dealValue) * 100).toFixed(1)}% of the booking value.`,
      electronics: `₹${deal.dealValue.toLocaleString("en-IN")} ${deal.merchant} device + ₹${premium} warranty extension = full peace of mind.`,
      food: `₹${premium} personal accident cover. Because your delivery matters more than the food.`,
      health: `Add OPD cover for ₹${premium}/month. Your ₹${deal.dealValue} health spend, protected.`,
      default: `₹${premium} for comprehensive protection on a ₹${deal.dealValue.toLocaleString("en-IN")} purchase. Smart math.`,
    },
    social_proof: {
      travel: `4.7★ rated cover. 2.3L travellers protected this month. Secure your ${deal.dealLabel} for ₹${premium}.`,
      electronics: `87% of ${deal.merchant} buyers add screen protection. Join them for ₹${premium}.`,
      food: `Top-rated by 50K+ food lovers. Personal accident cover for ₹${premium}.`,
      health: `Most-purchased with Pharmeasy orders. OPD cover, ₹${premium}/month.`,
      default: `Trusted by 1.2M GrabOn users. Add coverage for ₹${premium} — one tap.`,
    },
  };
  const catTemplates = templates[strategy];
  return catTemplates[deal.category] || catTemplates.default;
}

function genSessionId() {
  return "sess_" + Math.random().toString(36).slice(2, 10);
}

// ─── CLAUDE API ───────────────────────────────────────────────────────────────

async function callClaude(deal, product, premium, user) {
  const prompt = `You are an insurance copywriter for GrabInsurance, India's embedded micro-insurance platform.

Deal context:
- Merchant: ${deal.merchant}
- Product: ${deal.dealLabel}
- Category: ${deal.category} / ${deal.subcategory}
- Deal Value: ₹${deal.dealValue.toLocaleString("en-IN")}
- User: ${user.name}, risk tier: ${user.riskTier}, purchase history: ${user.purchaseHistory.join(", ")}

Insurance product recommended: ${product.name} (${product.desc})
Premium: ₹${premium}

Write ONE hyper-personalized insurance offer line (max 120 characters) that:
1. References the exact trip/product/context — not generic
2. States the exact premium in ₹
3. Feels like a friend recommending it, not a corporate push

Return ONLY the copy string. No explanation.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function DealCard({ deal, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(deal)}
      style={{
        background: selected ? deal.color + "22" : "#0d1117",
        border: selected ? `1.5px solid ${deal.color}` : "1.5px solid #21262d",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{deal.logo}</span>
        <div>
          <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{deal.merchant}</div>
          <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2 }}>{deal.dealLabel}</div>
        </div>
        <div style={{ marginLeft: "auto", color: deal.color, fontSize: 13, fontWeight: 700 }}>
          ₹{deal.dealValue.toLocaleString("en-IN")}
        </div>
      </div>
    </button>
  );
}

function InsuranceOfferCard({ rec, deal, user, abVariants, onConvert, convertedId }) {
  const { product, confidence } = rec;
  const [premium, setPremium] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const converted = convertedId === product.id;

  useEffect(() => {
    setLoadingPrice(true);
    setPremium(null);
    console.log("Fetching price for", product.id, deal.merchant);
    fetchPremiumQuote(product, deal, user).then(price => {
      console.log("Got price", price, "for", product.id);
      setPremium(price);
      setLoadingPrice(false);
    });
  }, [product.id, deal.id, user.id]);

  if (loadingPrice) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #161b22 0%, #0d1117 100%)",
        border: "1px solid #30363d", borderRadius: 16, padding: 20,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 28 }}>{product.icon}</div>
          <div>
            <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700 }}>{product.name}</div>
            <div style={{ color: "#58a6ff", fontSize: 12, marginTop: 4 }}>⏳ Fetching quote from Pricing API...</div>
          </div>
        </div>
        <div style={{ background: "#21262d", borderRadius: 8, height: 80, animation: "pulse 1.5s infinite" }} />
        <div style={{ background: "#21262d", borderRadius: 8, height: 40 }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #161b22 0%, #0d1117 100%)",
      border: "1px solid #30363d",
      borderRadius: 16,
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        background: confidence > 0.8 ? "#238636" : "#9b6700",
        color: "#fff", fontSize: 10, padding: "3px 10px",
        borderBottomLeftRadius: 8, fontFamily: "monospace",
      }}>
        {(confidence * 100).toFixed(0)}% match
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{product.icon}</span>
        <div>
          <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{product.name}</div>
          <div style={{ color: "#8b949e", fontSize: 12, marginTop: 3 }}>{product.desc}</div>
        </div>
      </div>

      <div style={{ background: "#0d1117", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ color: "#58a6ff", fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>A/B COPY VARIANTS</div>
        {COPY_STRATEGIES.map((s, i) => (
          <div key={s} style={{
            background: abVariants[s]?.winner ? "#1c2128" : "transparent",
            borderRadius: 6, padding: "8px 10px", marginBottom: 4,
            border: abVariants[s]?.winner ? "1px solid #30363d" : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ color: "#8b949e", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.replace("_", " ")}</span>
              {abVariants[s]?.winner && <span style={{ color: "#3fb950", fontSize: 10 }}>▲ Winning</span>}
            </div>
            <div style={{ color: "#c9d1d9", fontSize: 12, lineHeight: 1.5 }}>
              {abVariants[s]?.aiCopy || generateCopy(deal, product, s, premium)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#8b949e", fontSize: 11 }}>Premium <span style={{ color: "#30363d", fontSize: 9 }}>via Pricing API</span></div>
          {loadingPrice ? (
            <div style={{ color: "#58a6ff", fontSize: 14, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>Fetching quote...</div>
          ) : (
            <div style={{ color: "#e6edf3", fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>
              ₹{premium}<span style={{ fontSize: 12, color: "#8b949e", fontWeight: 400 }}>/policy</span>
            </div>
          )}
        </div>
        <button
          onClick={() => onConvert(product.id, premium)}
          disabled={converted || loadingPrice}
          style={{
            background: converted ? "#238636" : loadingPrice ? "#21262d" : "linear-gradient(135deg, #1f6feb, #388bfd)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 13, fontWeight: 700,
            cursor: converted || loadingPrice ? "default" : "pointer",
            transition: "all 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {converted ? "✓ Added" : loadingPrice ? "Loading..." : "Add Cover →"}
        </button>
      </div>
    </div>
  );
}

function ConversionDashboard({ events }) {
  const byStrategy = {};
  COPY_STRATEGIES.forEach(s => {
    const shown = events.filter(e => e.strategy === s).length;
    const converted = events.filter(e => e.strategy === s && e.converted).length;
    byStrategy[s] = { shown, converted, rate: shown ? ((converted / shown) * 100).toFixed(1) : 0 };
  });

  return (
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 16, padding: 20 }}>
      <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
        📊 Conversion Dashboard
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {COPY_STRATEGIES.map(s => (
          <div key={s} style={{ background: "#161b22", borderRadius: 10, padding: 12, textAlign: "center" }}>
            <div style={{ color: "#8b949e", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{s.replace("_", " ")}</div>
            <div style={{ color: "#e6edf3", fontSize: 24, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>{byStrategy[s].rate}%</div>
            <div style={{ color: "#8b949e", fontSize: 10, marginTop: 4 }}>{byStrategy[s].converted}/{byStrategy[s].shown} sessions</div>
          </div>
        ))}
      </div>
      <div style={{ color: "#58a6ff", fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>RECENT EVENTS</div>
      <div style={{ maxHeight: 160, overflowY: "auto" }}>
        {events.slice(-6).reverse().map((e, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0", borderBottom: "1px solid #21262d", fontSize: 11,
          }}>
            <span style={{ color: "#8b949e", fontFamily: "monospace" }}>{e.sessionId}</span>
            <span style={{ color: "#c9d1d9" }}>{e.merchant} · {e.strategy}</span>
            <span style={{ color: e.converted ? "#3fb950" : "#f85149" }}>{e.converted ? "✓ Converted" : "✗ Skipped"}</span>
          </div>
        ))}
        {events.length === 0 && <div style={{ color: "#8b949e", fontSize: 12, textAlign: "center", padding: 16 }}>No events yet. Select a deal to start.</div>}
      </div>
    </div>
  );
}

function MultiCartBanner({ deals, onClear }) {
  if (deals.length < 2) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, #1c2128, #0d1117)",
      border: "1px solid #9b6700", borderRadius: 12, padding: "12px 16px",
      marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ color: "#e3b341", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>🛒 Multi-category cart detected</div>
        <div style={{ color: "#8b949e", fontSize: 11 }}>
          {deals.map(d => d.merchant).join(" + ")} — showing best-matched insurance for each
        </div>
      </div>
      <button onClick={onClear} style={{ background: "none", border: "1px solid #30363d", color: "#8b949e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Clear Cart</button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function GrabInsurance() {
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [activeUser, setActiveUser] = useState(USER_PERSONAS[0]);
  const [sessionId] = useState(genSessionId);
  const [convertedIds, setConvertedIds] = useState({});
  const [events, setEvents] = useState([]);
  const [aiCopies, setAiCopies] = useState({});
  const [loadingAi, setLoadingAi] = useState({});
  const [activeTab, setActiveTab] = useState("storefront");

  const toggleDeal = useCallback((deal) => {
    setSelectedDeals(prev => {
      const exists = prev.find(d => d.id === deal.id);
      if (exists) return prev.filter(d => d.id !== deal.id);
      return [...prev, deal];
    });
  }, []);

  const fetchAiCopy = useCallback(async (deal, product) => {
    const key = `${deal.id}_${product.id}`;
    if (aiCopies[key] || loadingAi[key]) return;
    setLoadingAi(p => ({ ...p, [key]: true }));
    const copy = await callClaude(deal, product, calcPremium(product, deal, activeUser), activeUser);
    if (copy) setAiCopies(p => ({ ...p, [key]: copy }));
    setLoadingAi(p => ({ ...p, [key]: false }));
  }, [aiCopies, loadingAi, activeUser]);

  useEffect(() => {
    selectedDeals.forEach(deal => {
      const recs = classifyIntent(deal);
      recs.forEach(({ product }) => fetchAiCopy(deal, product));
    });
  }, [selectedDeals, fetchAiCopy]);

  // Assign a random winning variant per deal+product combo — persists for the session
  const abWinnersRef = React.useRef({});

  const getWinner = (dealId, productId) => {
    const key = `${dealId}_${productId}`;
    if (!abWinnersRef.current[key]) {
      const idx = Math.floor(Math.random() * COPY_STRATEGIES.length);
      abWinnersRef.current[key] = COPY_STRATEGIES[idx];
    }
    return abWinnersRef.current[key];
  };

  const handleConvert = (deal, productId, premium) => {
    const key = `${deal.id}_${productId}`;
    setConvertedIds(p => ({ ...p, [key]: true }));
    const strategy = getWinner(deal.id, productId);
    setEvents(p => [...p, {
      sessionId: sessionId.slice(-6),
      merchant: deal.merchant,
      productId,
      strategy,
      premium,
      converted: true,
      ts: Date.now(),
    }]);
  };

  const buildAbVariants = (deal, product) => {
    const premium = calcPremium(product, deal, activeUser);
    const key = `${deal.id}_${product.id}`;
    const winningStrategy = getWinner(deal.id, product.id);
    const result = {};
    COPY_STRATEGIES.forEach((s) => {
      result[s] = {
        copy:     generateCopy(deal, product, s, premium),
        aiCopy:   s === COPY_STRATEGIES[0] && aiCopies[key] ? aiCopies[key] : generateCopy(deal, product, s, premium),
        winner:   s === winningStrategy,
        strategy: s,
      };
    });
    return result;
  };

  const totalPremium = Object.entries(convertedIds)
    .filter(([, v]) => v)
    .reduce((acc, [key]) => {
      // key format is "D001_TI_CANCEL" — dealId is first segment, rest is productId
      const firstUnderscore = key.indexOf("_");
      const dealId = key.slice(0, firstUnderscore);
      const productId = key.slice(firstUnderscore + 1);
      const deal = MOCK_DEALS.find(d => d.id === dealId);
      const product = INSURANCE_CATALOG.find(p => p.id === productId);
      if (deal && product) return acc + calcPremium(product, deal, activeUser);
      return acc;
    }, 0);

  const tabs = [
    { id: "storefront", label: "Insurance Storefront" },
    { id: "dashboard", label: "A/B Dashboard" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#010409",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e6edf3",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "linear-gradient(135deg, #1f6feb, #388bfd)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>GrabInsurance</div>
            <div style={{ color: "#8b949e", fontSize: 11 }}>Contextual Embedded Insurance Engine v2</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {USER_PERSONAS.map(u => (
            <button key={u.id} onClick={() => { setActiveUser(u); setConvertedIds({}); }} style={{
              background: activeUser.id === u.id ? "#1f6feb22" : "transparent",
              border: activeUser.id === u.id ? "1px solid #1f6feb" : "1px solid #30363d",
              color: activeUser.id === u.id ? "#58a6ff" : "#8b949e",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            }}>{u.name.split(" ")[0]}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #21262d", background: "#0d1117" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #1f6feb" : "2px solid transparent",
            color: activeTab === t.id ? "#58a6ff" : "#8b949e", padding: "10px 20px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>{t.label}</button>
        ))}
        {totalPremium > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 20px", color: "#3fb950", fontSize: 13, fontWeight: 700 }}>
            Cart: ₹{totalPremium} in coverage
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {activeTab === "storefront" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
            {/* Deal Selector */}
            <div>
              {/* Trust Badges */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {["🏛️ IRDAI Regulated", "⚡ Instant Claim", "🔒 Secure Checkout"].map(badge => (
                  <div key={badge} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "#8b949e" }}>{badge}</div>
                ))}
              </div>
              <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>SELECT DEALS ({selectedDeals.length} in cart)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MOCK_DEALS.map(deal => (
                  <DealCard key={deal.id} deal={deal} selected={!!selectedDeals.find(d => d.id === deal.id)} onClick={toggleDeal} />
                ))}
              </div>
            </div>

            {/* Insurance Recommendations */}
            <div>
              <MultiCartBanner deals={selectedDeals} onClear={() => setSelectedDeals([])} />

              {/* Order Summary Panel — shows when covers are added */}
              {totalPremium > 0 && (
                <div style={{
                  background: "linear-gradient(135deg, #0d2b1a, #0d1117)",
                  border: "1px solid #238636", borderRadius: 16, padding: 16, marginBottom: 20,
                }}>
                  <div style={{ color: "#3fb950", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🛡️ Your Insurance Summary</div>
                  {Object.entries(convertedIds).filter(([, v]) => v).map(([key]) => {
                    const firstUnderscore = key.indexOf("_");
                    const dealId = key.slice(0, firstUnderscore);
                    const productId = key.slice(firstUnderscore + 1);
                    const deal = MOCK_DEALS.find(d => d.id === dealId);
                    const product = INSURANCE_CATALOG.find(p => p.id === productId);
                    if (!deal || !product) return null;
                    const p = calcPremium(product, deal, activeUser);
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a3a24" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{product.icon}</span>
                          <div>
                            <div style={{ color: "#e6edf3", fontSize: 12, fontWeight: 600 }}>{product.name}</div>
                            <div style={{ color: "#8b949e", fontSize: 10 }}>{deal.merchant} · {deal.dealLabel}</div>
                          </div>
                        </div>
                        <div style={{ color: "#3fb950", fontWeight: 700, fontFamily: "monospace" }}>₹{p}</div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <div style={{ color: "#8b949e", fontSize: 12 }}>Total Premium</div>
                    <div style={{ color: "#3fb950", fontSize: 18, fontWeight: 800, fontFamily: "monospace" }}>₹{totalPremium}</div>
                  </div>
                  <button style={{
                    width: "100%", marginTop: 12, background: "linear-gradient(135deg, #238636, #2ea043)",
                    color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14,
                    fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>✓ Proceed to Payment →</button>
                </div>
              )}

              {selectedDeals.length === 0 ? (
                <div style={{
                  background: "#0d1117", border: "1px dashed #30363d", borderRadius: 16,
                  padding: "60px 20px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
                  <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Protect your purchases</div>
                  <div style={{ color: "#8b949e", fontSize: 13 }}>Select a deal from the left to see personalised insurance recommendations powered by GrabInsurance</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
                    {["✈️ Travel", "📱 Electronics", "🍔 Food", "💊 Health"].map(cat => (
                      <div key={cat} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "6px 12px", color: "#8b949e", fontSize: 11 }}>{cat}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {selectedDeals.map(deal => {
                    const recs = classifyIntent(deal);
                    return (
                      <div key={deal.id}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10,
                          background: deal.color + "11", border: `1px solid ${deal.color}33`,
                          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
                        }}>
                          <span style={{ fontSize: 20 }}>{deal.logo}</span>
                          <span style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700 }}>{deal.merchant} — {deal.dealLabel}</span>
                          <span style={{ marginLeft: "auto", color: deal.color, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>₹{deal.dealValue.toLocaleString("en-IN")}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {recs.map(rec => {
                            const convKey = `${deal.id}_${rec.product.id}`;
                            return (
                              <InsuranceOfferCard
                                key={rec.product.id}
                                rec={rec}
                                deal={deal}
                                user={activeUser}
                                abVariants={buildAbVariants(deal, rec.product)}
                                onConvert={(pid, premium) => handleConvert(deal, pid, premium)}
                                convertedId={convertedIds[convKey] ? rec.product.id : null}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ConversionDashboard events={events} />

            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 16, padding: 20 }}>
              <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>🎯 Intent Classification Results</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {MOCK_DEALS.slice(0, 6).map(deal => {
                  const recs = classifyIntent(deal);
                  return (
                    <div key={deal.id} style={{ background: "#161b22", borderRadius: 10, padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{deal.logo}</span>
                        <div>
                          <div style={{ color: "#e6edf3", fontSize: 12, fontWeight: 700 }}>{deal.merchant}</div>
                          <div style={{ color: "#8b949e", fontSize: 10 }}>{deal.category}</div>
                        </div>
                      </div>
                      {recs.map(r => (
                        <div key={r.product.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ color: "#c9d1d9", fontSize: 11 }}>{r.product.icon} {r.product.name.split(" ").slice(0, 3).join(" ")}</span>
                          <span style={{
                            color: r.confidence > 0.8 ? "#3fb950" : "#e3b341",
                            fontSize: 10, fontFamily: "monospace",
                          }}>{(r.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 16, padding: 20 }}>
              <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>👤 User Risk Tiers</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {USER_PERSONAS.map(u => (
                  <div key={u.id} style={{
                    background: activeUser.id === u.id ? "#1f6feb11" : "#161b22",
                    border: activeUser.id === u.id ? "1px solid #1f6feb" : "1px solid #21262d",
                    borderRadius: 10, padding: 14,
                  }}>
                    <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{u.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#8b949e", fontSize: 11 }}>Risk Tier</span>
                      <span style={{ color: u.riskTier === "low" ? "#3fb950" : "#e3b341", fontSize: 11, fontWeight: 700 }}>{u.riskTier.toUpperCase()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#8b949e", fontSize: 11 }}>Frequency Score</span>
                      <span style={{ color: "#58a6ff", fontSize: 11, fontFamily: "monospace" }}>{u.frequencyScore}/10</span>
                    </div>
                    <div style={{ marginTop: 8, color: "#8b949e", fontSize: 10 }}>History: {u.purchaseHistory.join(", ")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
