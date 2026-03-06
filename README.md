# GrabInsurance — Contextual Embedded Insurance Engine
### GrabOn Vibe Coder Challenge 2025 | Project 02

---

## What I Built

GrabInsurance is a contextual embedded micro-insurance system that detects purchase intent from deal category data and serves the most relevant insurance product at the exact moment of deal redemption.

When a user is about to book a Goa flight on MakeMyTrip, the system automatically recommends Trip Cancellation Cover with personalized copy like *"Your ₹12,400 Goa trip. Protect it for ₹93."* — not generic insurance ads.

The system has two parts:
1. **React Frontend** — Insurance storefront UI that GrabOn can embed at any merchant checkout
2. **MCP Server** — Intent classification backend connectable to Claude Desktop

---

## Live Demo

- **Frontend:** React artifact (GrabInsurance.jsx)
- **MCP Server:** Connectable to Claude Desktop via `grabon-insurance-mcp`

---

## How to Run Locally

### 1. Frontend (React)
Open `GrabInsurance.jsx` in any React environment or Claude.ai artifacts.

### 2. MCP Server

**Prerequisites:** Node.js v18+

```bash
cd grabon-insurance-mcp
npm install
node index.js
```

**Connect to Claude Desktop** — add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "grabon-insurance": {
      "command": "node",
      "args": ["D:\\grabon-insurance-mcp\\index.js"]
    }
  }
}
```

Then restart Claude Desktop and test with:
```
list all available insurance products
classify intent for a MakeMyTrip flight deal worth 12400 for a low risk user called Goa Round Trip
get premium quote for screen damage protection on a Samsung smartphone worth 45000 for a medium risk user
```

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

## Technical Requirements — Checklist

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

### Tool 1: `classify_intent`
Takes a deal object and returns top 2 insurance recommendations with confidence scores, premiums and 3 A/B copy variants.

```
Input:  merchant, category, subcategory, deal_value, deal_label, risk_tier
Output: top 2 products with confidence %, premium ₹, and 3 copy variants
```

### Tool 2: `get_premium_quote`
Returns a detailed premium quote for a specific insurance product with full pricing breakdown.

```
Input:  product_id, deal_value, category, risk_tier
Output: premium ₹, pricing factors (base rate, risk multiplier, category loading)
```

### Tool 3: `list_insurance_products`
Lists all 8 insurance products in the catalog.

---

## Intent Classification Logic

The engine uses a subcategory-aware rule-based classifier with value boosting:

```
travel/flight    → Trip Cancellation (94%), Travel Medical (81%)
travel/holiday   → Trip Cancellation (96%), Travel Medical (88%)  
travel/hotel     → Trip Cancellation (78%), Return Journey (72%)
electronics/smartphone → Screen Damage (92%), Extended Warranty (76%)
electronics/audio      → Extended Warranty (83%), Screen Damage (58%)
food/delivery    → Personal Accident (88%), Purchase Protection (52%)
health/medicine  → Health OPD (91%), Purchase Protection (63%)
health/skincare  → Purchase Protection (74%), Health OPD (55%)
fashion/clothing → Purchase Protection (77%), Return Journey (61%)
```

High value deals (>₹10,000) get a +4% confidence boost — more to lose = more relevant insurance.

---

## Pricing Engine

Premium = `deal_value × base_rate × risk_multiplier × category_loading`

| Factor | Values |
|---|---|
| Risk Multiplier | Low: 0.85x, Medium: 1.0x, High: 1.2x |
| Category Loading | Travel: 1.10x, Health: 1.15x, Electronics: 1.05x, Food: 0.95x, Fashion: 0.90x |
| Minimum Premium | ₹29 per policy |

---

## A/B Testing Framework

Each deal+product combination gets a randomly assigned winning strategy at session start — persisted via `useRef` so it doesn't change during the session.

3 strategies tested:
- **Urgency** — creates time pressure ("Offer ends at checkout")
- **Value** — shows price as % of deal value ("0.7% of booking value")
- **Social Proof** — uses ratings and user counts ("2.3L travellers protected")

Conversion events are logged with `sessionId`, `merchant`, `strategy`, `premium`, and `timestamp` — visible in the A/B Dashboard.

---

## Multi-Category Cart

When a user selects deals from 2+ different categories (e.g. MakeMyTrip + Myntra), the system:
1. Shows a yellow "Multi-category cart detected" banner
2. Displays insurance recommendations for **each deal separately**
3. Allows adding covers for multiple deals simultaneously
4. Shows a consolidated insurance summary with total premium

---

## Key Architecture Decisions

**Why rule-based classification instead of ML model?**
Rule-based classifiers are explainable, auditable, and deterministic — exactly what an insurance partner needs for regulatory compliance. A black-box ML model would be harder to justify to IRDAI.

**Why mock pricing API with async delay instead of inline calculation?**
In production, pricing would come from an insurance partner's underwriting API. The async mock with realistic latency demonstrates the correct integration architecture even without a live partner API.

**Why MCP server instead of REST API?**
MCP allows Claude to use the intent classification and pricing tools natively through natural language — enabling GrabOn's team to query the insurance engine conversationally without building a separate dashboard.

---

## What I Would Do With More Time

1. **Real ML classification** — train a model on GrabOn's actual transaction data to learn which insurance products correlate with which purchase patterns
2. **Live insurance partner API** — integrate with a real IRDAI-registered insurer's pricing API
3. **Persistent A/B tracking** — store events in a database to accumulate real conversion data across sessions
4. **Fraud detection** — flag suspicious patterns like multiple high-value covers added in seconds
5. **WhatsApp notification** — send policy confirmation via WhatsApp Business API after purchase

---

## Project Structure

```
grabon-insurance-mcp/
├── index.js          # MCP server — 3 tools
├── package.json      # Node.js config
└── node_modules/     # Dependencies

GrabInsurance.jsx     # React frontend — full storefront UI
README.md             # This file
```

---

*Built for GrabOn Vibe Coder Challenge 2025 — Project 02: GrabInsurance*
