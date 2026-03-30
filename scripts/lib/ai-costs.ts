/**
 * scripts/lib/ai-costs.ts
 *
 * Shared utility for tracking API costs across all agents.
 * Supports Anthropic, DataForSEO, Tavily, and SerpAPI.
 */

const USD_TO_EUR = 0.92;

const RATES = {
  sonnet_input:  (3.00  / 1_000_000) * USD_TO_EUR,  // €/token
  sonnet_output: (15.00 / 1_000_000) * USD_TO_EUR,  // €/token
  haiku_input:   (0.80  / 1_000_000) * USD_TO_EUR,  // €/token
  haiku_output:  (4.00  / 1_000_000) * USD_TO_EUR,  // €/token
  tavily_search: 0.004 * USD_TO_EUR,                 // €/search
  serpapi_call:  0.010 * USD_TO_EUR,                 // €/call
};

export interface ApiCostsJson {
  anthropic?: { input_tokens: number; output_tokens: number; cost_eur: number };
  dataforseo?: { calls: number; cost_eur: number };
  tavily?:     { searches: number; cost_eur: number };
  serpapi?:    { calls: number; cost_eur: number };
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
  private dataforseoCalls = 0;
  private dataforseoUsd = 0;
  private tavilySearches = 0;
  private serpapiCalls = 0;

  addAnthropic(model: "sonnet" | "haiku", inputTokens: number, outputTokens: number): void {
    this.anthropicInputTokens += inputTokens;
    this.anthropicOutputTokens += outputTokens;
    if (model === "sonnet") {
      this.anthropicCostEur += inputTokens * RATES.sonnet_input + outputTokens * RATES.sonnet_output;
    } else {
      this.anthropicCostEur += inputTokens * RATES.haiku_input + outputTokens * RATES.haiku_output;
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

  toRunResult(): CostRunResult {
    const dataforseoCostEur = this.dataforseoUsd * USD_TO_EUR;
    const tavilyCostEur = this.tavilySearches * RATES.tavily_search;
    const serpapiCostEur = this.serpapiCalls * RATES.serpapi_call;

    const totalEur =
      this.anthropicCostEur + dataforseoCostEur + tavilyCostEur + serpapiCostEur;

    const apiCosts: ApiCostsJson = {};

    if (this.anthropicInputTokens > 0 || this.anthropicOutputTokens > 0) {
      apiCosts.anthropic = {
        input_tokens: this.anthropicInputTokens,
        output_tokens: this.anthropicOutputTokens,
        cost_eur: this.anthropicCostEur,
      };
    }
    if (this.dataforseoCalls > 0) {
      apiCosts.dataforseo = {
        calls: this.dataforseoCalls,
        cost_eur: dataforseoCostEur,
      };
    }
    if (this.tavilySearches > 0) {
      apiCosts.tavily = {
        searches: this.tavilySearches,
        cost_eur: tavilyCostEur,
      };
    }
    if (this.serpapiCalls > 0) {
      apiCosts.serpapi = {
        calls: this.serpapiCalls,
        cost_eur: serpapiCostEur,
      };
    }

    return {
      costEur: totalEur,
      tokensInput: this.anthropicInputTokens,
      tokensOutput: this.anthropicOutputTokens,
      apiCosts,
    };
  }
}

export function createCostTracker(): CostTracker {
  return new CostTracker();
}
