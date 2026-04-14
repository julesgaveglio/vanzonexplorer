export const CALENDLY_URL = "https://calendly.com/vanzonexplorer/accompagnement";

export type CalendlyWindow = Window & {
  Calendly?: { initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void };
};

export function loadCalendlyAssets(): Promise<void> {
  return new Promise((resolve) => {
    // CSS
    if (!document.querySelector('link[href*="calendly.com"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(link);
    }

    // JS — already loaded
    if ((window as CalendlyWindow).Calendly) {
      resolve();
      return;
    }

    // JS — script tag exists but loading
    const existing = document.querySelector('script[src*="calendly.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    // JS — load fresh
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}
