/**
 * scripts/lib/ai-costs.ts
 *
 * Shared utility for tracking API costs across all agents.
 * Supports Anthropic, DataForSEO, Tavily, and SerpAPI.
 */

const USD_TO_EUR = 0.92;

const RATES = {
  // Anthropic (Claude)
  sonnet_input:  (3.00  / 1_000_000) * USD_TO_EUR,
  sonnet_output: (15.00 / 1_000_000) * USD_TO_EUR,
  haiku_input:   (0.80  / 1_000_000) * USD_TO_EUR,
  haiku_output:  (4.00  / 1_000_000) * USD_TO_EUR,
  // Gemini (Google) — gemini-2.5-flash
  gemini_flash_input:  (0.15 / 1_000_000) * USD_TO_EUR,  // texte + images
  gemini_flash_output: (0.60 / 1_000_000) * USD_TO_EUR,
  // Groq (paid tier, used when free tier exhausted)
  groq_llama33_70b_input:  (0.59 / 1_000_000) * USD_TO_EUR,
  groq_llama33_70b_output: (0.79 / 1_000_000) * USD_TO_EUR,
  groq_llama31_8b_input:   (0.05 / 1_000_000) * USD_TO_EUR,
  groq_llama31_8b_output:  (0.08 / 1_000_000) * USD_TO_EUR,
  groq_gemma2_9b_input:    (0.20 / 1_000_000) * USD_TO_EUR,
  groq_gemma2_9b_output:   (0.20 / 1_000_000) * USD_TO_EUR,
  // Other
  tavily_search: 0.004 * USD_TO_EUR,
  serpapi_call:  0.010 * USD_TO_EUR,
};

export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-2.0-flash";
export type GroqModel =
  | "llama-3.3-70b-versatile"
  | "llama-3.1-8b-instant"
  | "gemma2-9b-it";

export interface ApiCostsJson {
  anthropic?: { input_tokens: number; output_tokens: number; cost_eur: number };
  gemini?:    { input_tokens: number; output_tokens: number; images?: number; model: string; cost_eur: number };
  groq?:      { input_tokens: number; output_tokens: number; model: string; cost_eur: number; free_tier?: boolean };
  dataforseo?: { calls: number; cost_eur: number };
  tavily?:     { searches: number; cost_eur: number };
  serpapi?:    { calls: number; cost_eur: number };
  resend?:     { emails: number; cost_eur: number };
}

export interface CostRunResult {
  costEur: number;
  tokensInput: number;
  tokensOutput: number;
  apiCosts: ApiCostsJson;
}

export class CostTracker {
  private anthropicInputTokens = 0;
  private anthropicOutputTokens = 0;
  private anthropicCostEur = 0;
  private geminiInputTokens = 0;
  private geminiOutputTokens = 0;
  private geminiImages = 0;
  private geminiCostEur = 0;
  private geminiModel = "gemini-2.5-flash";
  private groqInputTokens = 0;
  private groqOutputTokens = 0;
  private groqCostEur = 0;
  private groqModel = "llama-3.3-70b-versatile";
  private groqFreeTier = true;
  private dataforseoCalls = 0;
  private dataforseoUsd = 0;
  private tavilySearches = 0;
  private serpapiCalls = 0;
  private resendEmails = 0;

  addAnthropic(model: "sonnet" | "haiku", inputTokens: number, outputTokens: number): void {
    this.anthropicInputTokens += inputTokens;
    this.anthropicOutputTokens += outputTokens;
    this.anthropicCostEur += model === "sonnet"
      ? inputTokens * RATES.sonnet_input + outputTokens * RATES.sonnet_output
      : inputTokens * RATES.haiku_input + outputTokens * RATES.haiku_output;
  }

  /** Gemini Vision/text call — model defaults to gemini-2.5-flash */
  addGemini(inputTokens: number, outputTokens: number, images = 0, model: GeminiModel = "gemini-2.5-flash"): void {
    this.geminiInputTokens += inputTokens;
    this.geminiOutputTokens += outputTokens;
    this.geminiImages += images;
    this.geminiModel = model;
    // All Gemini 2.5 Flash: $0.15/M input (text+image), $0.60/M output
    this.geminiCostEur += inputTokens * RATES.gemini_flash_input + outputTokens * RATES.gemini_flash_output;
  }

  /** Groq call — free_tier=true means $0 cost (within daily free quota) */
  addGroq(inputTokens: number, outputTokens: number, model: GroqModel, freeTier = true): void {
    this.groqInputTokens += inputTokens;
    this.groqOutputTokens += outputTokens;
    this.groqModel = model;
    this.groqFreeTier = freeTier;
    if (!freeTier) {
      if (model === "llama-3.3-70b-versatile") {
        this.groqCostEur += inputTokens * RATES.groq_llama33_70b_input + outputTokens * RATES.groq_llama33_70b_output;
      } else if (model === "llama-3.1-8b-instant") {
        this.groqCostEur += inputTokens * RATES.groq_llama31_8b_input + outputTokens * RATES.groq_llama31_8b_output;
      } else {
        this.groqCostEur += inputTokens * RATES.groq_gemma2_9b_input + outputTokens * RATES.groq_gemma2_9b_output;
      }
    }
  }

  addDataForSeo(usdCost: number): void {
    this.dataforseoCalls += 1;
    this.dataforseoUsd += usdCost;
  }

  addTavily(searches: number): void {
    this.tavilySearches += searches;
  }

  addSerpApi(calls: number): void {
    this.serpapiCalls += calls;
  }

  /** Resend — $0.0008/email on paid plan (above free 100/month) */
  addResend(emails: number): void {
    this.resendEmails += emails;
    // $0.001/email × EUR
    // For now tracked at $0 since likely within free tier
  }

  toRunResult(): CostRunResult {
    const dataforseoCostEur = this.dataforseoUsd * USD_TO_EUR;
    const tavilyCostEur = this.tavilySearches * RATES.tavily_search;
    const serpapiCostEur = this.serpapiCalls * RATES.serpapi_call;

    const totalEur =
      this.anthropicCostEur +
      this.geminiCostEur +
      this.groqCostEur +
      dataforseoCostEur +
      tavilyCostEur +
      serpapiCostEur;

    const totalInputTokens = this.anthropicInputTokens + this.geminiInputTokens + this.groqInputTokens;
    const totalOutputTokens = this.anthropicOutputTokens + this.geminiOutputTokens + this.groqOutputTokens;

    const apiCosts: ApiCostsJson = {};

    if (this.anthropicInputTokens > 0 || this.anthropicOutputTokens > 0) {
      apiCosts.anthropic = {
        input_tokens: this.anthropicInputTokens,
        output_tokens: this.anthropicOutputTokens,
        cost_eur: this.anthropicCostEur,
      };
    }
    if (this.geminiInputTokens > 0 || this.geminiOutputTokens > 0) {
      apiCosts.gemini = {
        input_tokens: this.geminiInputTokens,
        output_tokens: this.geminiOutputTokens,
        images: this.geminiImages || undefined,
        model: this.geminiModel,
        cost_eur: this.geminiCostEur,
      };
    }
    if (this.groqInputTokens > 0 || this.groqOutputTokens > 0) {
      apiCosts.groq = {
        input_tokens: this.groqInputTokens,
        output_tokens: this.groqOutputTokens,
        model: this.groqModel,
        cost_eur: this.groqCostEur,
        free_tier: this.groqFreeTier,
      };
    }
    if (this.dataforseoCalls > 0) {
      apiCosts.dataforseo = { calls: this.dataforseoCalls, cost_eur: dataforseoCostEur };
    }
    if (this.tavilySearches > 0) {
      apiCosts.tavily = { searches: this.tavilySearches, cost_eur: tavilyCostEur };
    }
    if (this.serpapiCalls > 0) {
      apiCosts.serpapi = { calls: this.serpapiCalls, cost_eur: serpapiCostEur };
    }
    if (this.resendEmails > 0) {
      apiCosts.resend = { emails: this.resendEmails, cost_eur: 0 };
    }

    return {
      costEur: totalEur,
      tokensInput: totalInputTokens,
      tokensOutput: totalOutputTokens,
      apiCosts,
    };
  }
}

export function createCostTracker(): CostTracker {
  return new CostTracker();
}
