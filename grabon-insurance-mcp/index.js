import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const INSURANCE_CATALOG = [
  { id: "TI_CANCEL",  name: "Trip Cancellation Cover",       category: "travel",      icon: "✈️",  baseRate: 0.008, desc: "Covers non-refundable costs if you cancel" },
  { id: "TI_MEDICAL", name: "Travel Medical Insurance",       category: "travel",      icon: "🏥",  baseRate: 0.006, desc: "Medical emergencies while travelling" },
  { id: "EW_EXTENDED",name: "Electronics Extended Warranty",  category: "electronics", icon: "🔧",  baseRate: 0.04,  desc: "Extend your manufacturer warranty by 1 year" },
  { id: "EW_SCREEN",  name: "Screen Damage Protection",       category: "electronics", icon: "📱",  baseRate: 0.025, desc: "Accidental screen damage and drops" },
  { id: "PA_FOOD",    name: "Personal Accident Cover",        category: "food",        icon: "🛵",  baseRate: 12,    desc: "Personal accident during food delivery" },
  { id: "HE_OPD",    name: "Health OPD Cover",               category: "health",      icon: "💊",  baseRate: 0.015, desc: "Outpatient consultations and diagnostics" },
  { id: "TI_RETURN",  name: "Return Journey Protection",      category: "travel",      icon: "🔄",  baseRate: 0.005, desc: "Covers missed connections and rebooking" },
  { id: "PP_PURCHASE",name: "Purchase Protection",            category: "general",     icon: "🛡️", baseRate: 0.012, desc: "Theft or damage within 30 days of purchase" },
];

function classifyIntent(category, subcategory, dealValue) {
  const intentMap = {
    travel: {
      flight:  [{ id: "TI_CANCEL", confidence: 0.94 }, { id: "TI_MEDICAL", confidence: 0.81 }],
      hotel:   [{ id: "TI_CANCEL", confidence: 0.78 }, { id: "TI_RETURN",  confidence: 0.72 }],
      holiday: [{ id: "TI_CANCEL", confidence: 0.96 }, { id: "TI_MEDICAL", confidence: 0.88 }],
      default: [{ id: "TI_CANCEL", confidence: 0.82 }, { id: "TI_MEDICAL", confidence: 0.69 }],
    },
    electronics: {
      smartphone: [{ id: "EW_SCREEN",   confidence: 0.92 }, { id: "EW_EXTENDED", confidence: 0.76 }],
      audio:      [{ id: "EW_EXTENDED", confidence: 0.83 }, { id: "EW_SCREEN",   confidence: 0.58 }],
      default:    [{ id: "EW_EXTENDED", confidence: 0.79 }, { id: "EW_SCREEN",   confidence: 0.66 }],
    },
    food: {
      delivery: [{ id: "PA_FOOD",     confidence: 0.88 }, { id: "PP_PURCHASE", confidence: 0.52 }],
      dining:   [{ id: "PA_FOOD",     confidence: 0.71 }, { id: "PP_PURCHASE", confidence: 0.48 }],
      default:  [{ id: "PA_FOOD",     confidence: 0.75 }, { id: "PP_PURCHASE", confidence: 0.50 }],
    },
    health: {
      medicine: [{ id: "HE_OPD",      confidence: 0.91 }, { id: "PP_PURCHASE", confidence: 0.63 }],
      skincare: [{ id: "PP_PURCHASE", confidence: 0.74 }, { id: "HE_OPD",      confidence: 0.55 }],
      default:  [{ id: "HE_OPD",      confidence: 0.80 }, { id: "PP_PURCHASE", confidence: 0.60 }],
    },
    fashion: {
      clothing: [{ id: "PP_PURCHASE", confidence: 0.77 }, { id: "TI_RETURN",   confidence: 0.61 }],
      default:  [{ id: "PP_PURCHASE", confidence: 0.70 }, { id: "TI_RETURN",   confidence: 0.55 }],
    },
    general: {
      default:  [{ id: "PP_PURCHASE", confidence: 0.65 }, { id: "HE_OPD",      confidence: 0.50 }],
    },
  };
  const categoryMap = intentMap[category] || intentMap.general;
  const matches = categoryMap[subcategory] || categoryMap.default;
  const valueBoost = dealValue > 10000 ? 0.04 : dealValue > 3000 ? 0.02 : 0;
  return matches.map(({ id, confidence }) => ({
    product: INSURANCE_CATALOG.find(p => p.id === id),
    confidence: Math.min(0.99, confidence + valueBoost),
  }));
}

function calcPremium(product, dealValue, riskTier, category) {
  const tierMult = riskTier === "low" ? 0.85 : riskTier === "medium" ? 1.0 : 1.2;
  const categoryLoading = { travel: 1.10, electronics: 1.05, food: 0.95, health: 1.15, fashion: 0.90, general: 1.00 };
  const loading = categoryLoading[category] || 1.0;
  if (product.baseRate > 10) return Math.round(product.baseRate * tierMult * loading);
  const raw = dealValue * product.baseRate * tierMult * loading;
  return Math.max(29, Math.round(raw));
}

function generateCopy(merchant, dealLabel, dealValue, category, productName, premium, strategy) {
  const formatted = dealValue.toLocaleString("en-IN");
  const templates = {
    urgency: {
      travel:      `Your ₹${formatted} ${dealLabel} trip. Secure it now for ₹${premium}. Offer ends at checkout.`,
      electronics: `Protect your new ${merchant} device — cover for just ₹${premium}. Limited slots today.`,
      food:        `Order with confidence. Personal accident cover for ₹${premium}. Expires at checkout.`,
      health:      `Your health deserves backup. OPD cover for ₹${premium} — activate before purchase.`,
      default:     `One-tap protection for ₹${premium}. Don't miss it — expires with this session.`,
    },
    value: {
      travel:      `Your ₹${formatted} ${dealLabel}. Protect it for ₹${premium} — that's ${((premium / dealValue) * 100).toFixed(1)}% of booking value.`,
      electronics: `₹${formatted} ${merchant} device + ₹${premium} warranty = full peace of mind.`,
      food:        `₹${premium} personal accident cover. Because your safety matters more than the food.`,
      health:      `Add OPD cover for ₹${premium}/month. Your ₹${formatted} health spend, protected.`,
      default:     `₹${premium} for protection on a ₹${formatted} purchase. Smart math.`,
    },
    social_proof: {
      travel:      `4.7★ rated cover. 2.3L travellers protected this month. Secure your ${dealLabel} for ₹${premium}.`,
      electronics: `87% of ${merchant} buyers add screen protection. Join them for ₹${premium}.`,
      food:        `Top-rated by 50K+ food lovers. Personal accident cover for ₹${premium}.`,
      health:      `Most-purchased with health orders. OPD cover, ₹${premium}/month.`,
      default:     `Trusted by 1.2M GrabOn users. Add coverage for ₹${premium} — one tap.`,
    },
  };
  const stratTemplates = templates[strategy] || templates.value;
  return stratTemplates[category] || stratTemplates.default;
}

const server = new McpServer({ name: "grabon-insurance-mcp", version: "1.0.0" });

server.tool("classify_intent", "Classify a GrabOn deal and return top 2 insurance products with confidence scores and premium quotes", {
    merchant:    z.string().describe("Merchant name e.g. MakeMyTrip, Samsung, Swiggy"),
    category:    z.enum(["travel", "electronics", "food", "health", "fashion", "general"]),
    subcategory: z.string().describe("e.g. flight, hotel, smartphone, delivery"),
    deal_value:  z.number().describe("Deal value in INR"),
    deal_label:  z.string().describe("e.g. Goa Round Trip"),
    risk_tier:   z.enum(["low", "medium", "high"]).default("medium"),
  },
  async ({ merchant, category, subcategory, deal_value, deal_label, risk_tier }) => {
    const recommendations = classifyIntent(category, subcategory, deal_value);
    const results = recommendations.map(({ product, confidence }) => {
      const premium = calcPremium(product, deal_value, risk_tier, category);
      return {
        product_id: product.id, product_name: product.name,
        description: product.desc, icon: product.icon,
        confidence: `${(confidence * 100).toFixed(0)}%`,
        premium: `₹${premium}`,
        copy_variants: {
          urgency:      generateCopy(merchant, deal_label, deal_value, category, product.name, premium, "urgency"),
          value:        generateCopy(merchant, deal_label, deal_value, category, product.name, premium, "value"),
          social_proof: generateCopy(merchant, deal_label, deal_value, category, product.name, premium, "social_proof"),
        },
      };
    });
    return { content: [{ type: "text", text: JSON.stringify({ deal: { merchant, category, subcategory, deal_value, deal_label }, user_risk_tier: risk_tier, recommendations: results, session_id: "sess_" + Math.random().toString(36).slice(2, 8), timestamp: new Date().toISOString() }, null, 2) }] };
  }
);

server.tool("get_premium_quote", "Get a premium quote for a specific insurance product", {
    product_id: z.enum(["TI_CANCEL","TI_MEDICAL","EW_EXTENDED","EW_SCREEN","PA_FOOD","HE_OPD","TI_RETURN","PP_PURCHASE"]),
    deal_value: z.number(), category: z.enum(["travel","electronics","food","health","fashion","general"]),
    risk_tier:  z.enum(["low","medium","high"]).default("medium"),
  },
  async ({ product_id, deal_value, category, risk_tier }) => {
    const product = INSURANCE_CATALOG.find(p => p.id === product_id);
    if (!product) return { content: [{ type: "text", text: `Product ${product_id} not found` }] };
    const premium = calcPremium(product, deal_value, risk_tier, category);
    return { content: [{ type: "text", text: JSON.stringify({ product_id, product_name: product.name, description: product.desc, deal_value: `₹${deal_value.toLocaleString("en-IN")}`, risk_tier, premium: `₹${premium}`, pricing_factors: { base_rate: product.baseRate, risk_multiplier: risk_tier === "low" ? 0.85 : risk_tier === "medium" ? 1.0 : 1.2, category_loading: { travel:1.10,electronics:1.05,food:0.95,health:1.15,fashion:0.90,general:1.00 }[category] } }, null, 2) }] };
  }
);

server.tool("list_insurance_products", "List all available GrabInsurance products", {}, async () => {
  return { content: [{ type: "text", text: JSON.stringify({ total_products: INSURANCE_CATALOG.length, products: INSURANCE_CATALOG.map(p => ({ id: p.id, name: p.name, category: p.category, icon: p.icon, desc: p.desc })) }, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);