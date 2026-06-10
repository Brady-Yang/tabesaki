import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { ExtractionResult } from "@/types/database";

// Hint to Vercel: allow up to 60s for this route (extraction + browser fetching)
export const maxDuration = 60;

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are extracting reservation information for a high-end Japanese restaurant.

You will receive:
- The restaurant's name and address
- Search results from reservation platforms (URL + title + snippet from Google)
- Pre-fetched page content from the restaurant's website and any platform pages

Use the search result title and snippet to verify whether each URL is for the correct restaurant. Same-name restaurants are common in Japan — do not confuse them.

If a platform URL is verified as the correct restaurant (even if the fetched page content is unhelpful), include it in the output with the exact URL from the search results.

Extract the following from verified sources:

1. Reservation platforms (check for these specifically):
   Omakase.in | Pocket Concierge | TableAll | TableCheck | Tabelog | Ikyu | Other
   For each found: URL, priority (1 = most prominent / best for booking)

2. Booking window rules — two patterns:
   - Rolling: bookings open X days before the desired date
     → advance_type "rolling", fill advance_days
   - Fixed calendar: bookings for a given month open on a fixed date of a prior month
     (e.g. October reservations open on September 1st)
     → advance_type "fixed_calendar", fill open_day_of_month + open_months_prior
   Also extract: booking_open_hour (0–23), booking_open_minute (0–59),
   booking_open_tz (IANA timezone, default "Asia/Tokyo")

3. Pricing in JPY (integers):
   Course price range, lunch vs dinner if different, any price notes

Return ONLY valid JSON matching this exact structure:
{
  "platforms": [
    {
      "website": "Pocket Concierge",
      "url": "https://...",
      "priority": 1,
      "advance_type": "rolling",
      "advance_days": 30,
      "open_day_of_month": null,
      "open_months_prior": null,
      "booking_open_hour": 10,
      "booking_open_minute": 0,
      "booking_open_tz": "Asia/Tokyo",
      "course_price": 55000,
      "course_description": "Omakase course",
      "notes": null
    }
  ],
  "price_range_min": 30000,
  "price_range_max": 55000,
  "price_notes": "Lunch from ¥30,000, dinner from ¥55,000",
  "extraction_notes": "Any caveats about confidence or missing data"
}

Rules:
- Only include a platform if you confirmed it is for the correct restaurant
- Always use the exact URL from the search results — never replace it with the site homepage
- Use null for any field you cannot confidently determine — do not guess
- For rolling: fill advance_days, set open_day_of_month and open_months_prior to null
- For fixed_calendar: fill open_day_of_month and open_months_prior, set advance_days to null
- Return ONLY the JSON object — no markdown, no explanation`;

// Content shorter than this after HTML cleaning is likely a SPA shell
const SPA_THRESHOLD = 500;

function cleanHtml(html: string, maxLength: number): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Tabesaki/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

// Render SPA pages via headless browser, return visible text per URL
async function fetchWithBrowser(
  urls: string[],
  maxLength: number
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  if (urls.length === 0) return results;

  console.log(`  [browser] launching for ${urls.length} SPA URL(s)…`);
  // Dynamic import keeps Puppeteer out of the Next.js bundle
  const { default: puppeteer } = await import("puppeteer");
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    await Promise.allSettled(
      urls.map(async (url) => {
        let page;
        try {
          page = await browser!.newPage();
          await page.setUserAgent("Mozilla/5.0 (compatible; Tabesaki/1.0)");
          await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
          const text: string = await page.evaluate(
            () => (document.body as HTMLElement).innerText ?? ""
          );
          if (text.length > 200) {
            results.set(url, text.slice(0, maxLength));
            console.log(`  [browser] ${url} → ${text.length} chars`);
          } else {
            console.log(`  [browser] ${url} → still too short (${text.length} chars)`);
          }
        } catch (err) {
          console.log(`  [browser] ${url} → failed: ${err}`);
        } finally {
          await page?.close();
        }
      })
    );
  } catch (err) {
    console.log(`  [browser] launch failed: ${err}`);
  } finally {
    await browser?.close();
  }

  return results;
}

interface SerperResult {
  url: string;
  title: string;
  snippet: string;
}

async function searchPlatformUrls(
  restaurantName: string,
  city: string
): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const sites = [
    "omakase.in",
    "tablecheck.com",
    "pocketconcierge.jp",
    "tableall.com",
    "tabelog.com",
    "ikyu.com",
  ]
    .map((s) => `site:${s}`)
    .join(" OR ");

  const queryParts = [restaurantName];
  if (city && city !== "Other") queryParts.push(city);
  const q = `${queryParts.join(" ")} (${sites})`;

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, num: 10 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.organic ?? []).map(
      (item: { link: string; title: string; snippet: string }) => ({
        url: item.link,
        title: item.title ?? "",
        snippet: item.snippet ?? "",
      })
    );
  } catch {
    return [];
  }
}

const empty: ExtractionResult = { platforms: [], closed_days_of_week: null };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { websiteUrl, restaurantName, address, city, reservationUri } =
    await request.json();

  // Parallel: Serper platform search + restaurant website fetch
  const [serperResults, websiteHtml] = await Promise.all([
    searchPlatformUrls(restaurantName, city ?? ""),
    websiteUrl ? fetchHtml(websiteUrl) : Promise.resolve(null),
  ]);

  const websiteContent = websiteHtml
    ? cleanHtml(websiteHtml, 15000)
    : null;

  console.log("\n─── EXTRACT DEBUG ───────────────────────────────────────");
  console.log(`Restaurant: ${restaurantName} | ${address}`);
  console.log(`Serper results (${serperResults.length}):`);
  serperResults.forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.url}]\n     Title: ${r.title}\n     Snippet: ${r.snippet}`)
  );

  // Deduplicated candidate URL pool
  const candidateUrls = Array.from(
    new Set([
      ...(reservationUri ? [reservationUri] : []),
      ...serperResults.map((r) => r.url),
    ])
  ).slice(0, 8);

  // First pass: regular fetch for all candidate URLs
  const firstPassResults = await Promise.all(
    candidateUrls.map(async (url) => {
      const html = await fetchHtml(url);
      const content = html ? cleanHtml(html, 8000) : null;
      return { url, content };
    })
  );

  // Second pass: re-fetch SPAs (too short after HTML cleaning) via headless browser
  const spaUrls = firstPassResults
    .filter(({ content }) => !content || content.length < SPA_THRESHOLD)
    .map(({ url }) => url);

  const browserContent = await fetchWithBrowser(spaUrls, 8000);

  // Merge: prefer browser content for SPA URLs
  const platformPages = firstPassResults
    .map(({ url, content }) => ({
      url,
      content:
        browserContent.get(url) ??
        (content && content.length >= 200 ? content : null),
    }))
    .filter((p): p is { url: string; content: string } => p.content !== null);

  console.log(`Platform pages after fetch + browser (${platformPages.length}/${candidateUrls.length}):`);
  platformPages.forEach((p) =>
    console.log(`  [${p.url}] ${p.content.length} chars — preview: ${p.content.slice(0, 120)}…`)
  );

  // Build user message
  const searchResultsSection =
    serperResults.length > 0
      ? `=== Reservation platform search results ===\n` +
        serperResults
          .map((r) => `URL: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.snippet}`)
          .join("\n\n")
      : "";

  const websiteSection =
    websiteContent && websiteContent.length >= 200
      ? `=== Restaurant website (${websiteUrl}) ===\n${websiteContent}`
      : "";

  const fetchedSection =
    platformPages.length > 0
      ? `=== Fetched platform pages ===\n` +
        platformPages.map((p) => `[${p.url}]\n${p.content}`).join("\n\n")
      : "";

  const sources = [searchResultsSection, websiteSection, fetchedSection].filter(Boolean);
  if (sources.length === 0) return Response.json(empty);

  const userMessage = `Restaurant: ${restaurantName}
Address: ${address ?? "unknown"}

${sources.join("\n\n")}`;

  console.log(`\nUser message sent to Claude (${userMessage.length} chars total)`);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ] as Parameters<typeof anthropic.messages.create>[0]["system"],
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    console.log("\nClaude raw response:");
    console.log(text);
    console.log("─────────────────────────────────────────────────────────\n");

    // Extract JSON even when Claude wraps it in markdown or adds analysis text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ;
    const jsonStr = jsonMatch
      ? jsonMatch[1]
      : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const result: ExtractionResult = JSON.parse(jsonStr);
    result.platforms = (result.platforms ?? []).map((p, i) => ({
      ...p,
      priority: p.priority ?? i + 1,
      ai_extracted: true,
    }));
    result.closed_days_of_week = null;
    return Response.json(result);
  } catch {
    return Response.json(empty);
  }
}
