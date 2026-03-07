# GrabInsurance — Contextual Embedded Insurance Engine
### GrabOn Vibe Coder Challenge 2025 | Project 02

---

## 🚀 Quick Demo (No Setup Required)

**Frontend — runs instantly in browser:**
1. Go to [claude.ai](https://claude.ai)
2. Start a new chat
3. Upload `GrabInsurance.jsx` from this repo
4. Ask Claude: *"Render this React component as an artifact"*
5. The full insurance storefront will appear instantly ✅

**MCP Server — test via Claude Desktop:**
```
list all available insurance products
classify intent for a MakeMyTrip flight deal worth 12400 for a low risk user called Goa Round Trip
get premium quote for screen damage protection on a Samsung smartphone worth 45000 for a medium risk user
```

---

## What I Built

GrabInsurance is a contextual embedded micro-insurance system that detects purchase intent from deal category data and serves the most relevant insurance product at the exact moment of deal redemption.

When a user is about to book a Goa flight on MakeMyTrip, the system automatically recommends Trip Cancellation Cover with personalized copy like *"Your ₹12,400 Goa trip. Protect it for ₹93."* — not generic insurance ads.

**Two parts:**
1. **React Frontend** — Insurance storefront UI embeddable at any merchant checkout
2. **MCP Server** — Intent classification backend connectable to Claude Desktop

---

## How to Run Locally

### Frontend
1. Upload `GrabInsurance.jsx` to [claude.ai](https://claude.ai) artifacts — runs instantly, no install needed
2. OR open in any React environment (Vite, Create React App etc.)

### MCP Server

**Prerequisites:** Node.js v18+

```bash
git clone https://github.com/rajhustle/grabon_insurance
cd grabon_insurance/grabon-insurance-mcp
npm install
node index.js
```

**Connect to Claude Desktop** — find your config file:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add this (replace the path with wherever you cloned the repo):

```json
{
  "mcpServers": {
    "grabon-insurance": {
      "command": "node",
      "args": ["C:\\path\\to\\grabon_insurance\\grabon-insurance-mcp\\index.js"]
    }
  }
}
```

Restart Claude Desktop. You should see grabon-insurance in Settings → Developer.

---

## Architecture

```
User selects deal
       ↓
Intent Classification Engine
(category + subcategory + deal value → top 2 insurance products + confidence scores)
       ↓
Mock Pricing API
(deal value × base rate × risk tier multiplier × category loading factor → premium)
       ↓
Claude API
(generates hyper-personalized copy for each product × 3 A/B variants)
       ↓
Insurance Storefront UI
(shows recommendations, tracks conversions, logs A/B events)
```

---

## Technical Requirements Checklist

| Requirement | Status | Where |
|---|---|---|
| Intent classification MCP with confidence scores | ✅ Done | `index.js` → `classify_intent` tool |
| 8 insurance products catalog | ✅ Done | `INSURANCE_CATALOG` in both files |
| Mock pricing API with dynamic premiums | ✅ Done | `fetchPremiumQuote()` — async with loading state |
| Claude personalized copy generation | ✅ Done | `callClaude()` — calls Anthropic API |
| A/B testing — 3 variants, random per session | ✅ Done | `getWinner()` + `buildAbVariants()` |
| Multi-category cart handling | ✅ Done | `MultiCartBanner` component |
| 10 mock deals across 5 categories | ✅ Done | `MOCK_DEALS` array |
| Conversion tracking dashboard | ✅ Done | `ConversionDashboard` component |
| Session IDs | ✅ Done | `genSessionId()` |
| MCP server connectable to Claude Desktop | ✅ Done | `grabon-insurance-mcp/index.js` |
| Polished checkout UI | ✅ Done | Trust badges, order summary, payment button |

---

## MCP Server — 3 Tools

### Tool 1: classify_intent
Takes a deal object and returns top 2 insurance recommendations with confidence scores, premiums and 3 A/B copy variants.
```
Input:  merchant, category, subcategory, deal_value, deal_label, risk_tier
Output: top 2 products with confidence %, premium, and 3 copy variants
```

### Tool 2: get_premium_quote
Returns a detailed premium quote for a specific insurance product with full pricing breakdown.
```
Input:  product_id, deal_value, category, risk_tier
Output: premium, pricing factors (base rate, risk multiplier, category loading)
```

### Tool 3: list_insurance_products
Lists all 8 insurance products in the catalog.

---

## Intent Classification Logic

Subcategory-aware rule-based classifier with value boosting:

```
travel/flight         → Trip Cancellation (94%), Travel Medical (81%)
travel/holiday        → Trip Cancellation (96%), Travel Medical (88%)
travel/hotel          → Trip Cancellation (78%), Return Journey (72%)
electronics/smartphone → Screen Damage (92%), Extended Warranty (76%)
electronics/audio     → Extended Warranty (83%), Screen Damage (58%)
food/delivery         → Personal Accident (88%), Purchase Protection (52%)
health/medicine       → Health OPD (91%), Purchase Protection (63%)
health/skincare       → Purchase Protection (74%), Health OPD (55%)
fashion/clothing      → Purchase Protection (77%), Return Journey (61%)
```

High value deals (>10,000) get a +4% confidence boost.

---

## Pricing Engine

Premium = deal_value x base_rate x risk_multiplier x category_loading

| Factor | Values |
|---|---|
| Risk Multiplier | Low: 0.85x, Medium: 1.0x, High: 1.2x |
| Category Loading | Travel: 1.10x, Health: 1.15x, Electronics: 1.05x, Food: 0.95x, Fashion: 0.90x |
| Minimum Premium | 29 per policy |

---

## A/B Testing Framework

Each deal+product gets a randomly assigned winning strategy at session start via useRef.

- Urgency — time pressure ("Offer ends at checkout")
- Value — price as % of deal ("0.7% of booking value")
- Social Proof — ratings and counts ("2.3L travellers protected")

Conversion events logged with sessionId, merchant, strategy, premium, timestamp.

---

## Multi-Category Cart

Selecting MakeMyTrip + Myntra simultaneously:
1. Yellow "Multi-category cart detected" banner appears
2. Insurance shown separately for each deal
3. Consolidated summary with total premium
4. "Proceed to Payment" button

---

## Key Architecture Decisions

**Why rule-based classification?**
Explainable, auditable, deterministic — required for IRDAI regulatory compliance. A black-box ML model is harder to justify to insurance partners.

**Why async mock pricing API?**
In production, pricing comes from an insurance partner's underwriting API. The async mock with realistic latency demonstrates the correct integration architecture.

**Why MCP server?**
MCP lets Claude query the insurance engine via natural language — GrabOn's team can ask "what insurance should we show for a Zomato deal?" without building a separate dashboard.

---

## What I Would Do With More Time

1. Real ML classification trained on GrabOn's transaction data
2. Live IRDAI-registered insurer pricing API integration
3. Persistent A/B tracking with database storage
4. Fraud detection for suspicious purchase patterns
5. WhatsApp policy confirmation via WhatsApp Business API

---

## Project Structure

```
grabon_insurance/
├── GrabInsurance.jsx          # React frontend — full storefront UI
├── README.md                  # This file
└── grabon-insurance-mcp/
    ├── index.js               # MCP server — 3 tools
    ├── package.json           # Node.js config
    └── node_modules/          # Dependencies
```

---

*Built for GrabOn Vibe Coder Challenge 2025 — Project 02: GrabInsurance*
