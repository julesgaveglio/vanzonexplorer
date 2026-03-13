const DFS_BASE = "https://api.dataforseo.com/v3";

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

export async function dfsPost<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!res.ok) {
    throw new Error(`DataForSEO error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${json.status_message}`);
  }

  return json.tasks?.[0]?.result?.[0] as T;
}

export const DFS_TARGET = "vanzonexplorer.com";
export const DFS_LOCATION = "France";
export const DFS_LANGUAGE = "fr";
export const DFS_LOCATION_CODE = 2250;
export const DFS_LANGUAGE_CODE = "fr";

export async function dfsPostRaw<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`DataForSEO HTTP error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}
