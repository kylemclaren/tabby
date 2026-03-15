/** Domains where OG images are typically better than screenshots */
const OG_PREFERRED_DOMAINS = new Set([
  "github.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "vimeo.com",
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "spotify.com",
  "open.spotify.com",
  "soundcloud.com",
  "twitch.tv",
  "www.twitch.tv",
  "medium.com",
  "dev.to",
  "linkedin.com",
  "www.linkedin.com",
  "facebook.com",
  "www.facebook.com",
  "pinterest.com",
  "www.pinterest.com",
  "flickr.com",
  "www.flickr.com",
  "imgur.com",
  "i.imgur.com",
])

const TWEET_DOMAINS = new Set(["twitter.com", "x.com", "mobile.twitter.com", "mobile.x.com"])

export function shouldPreferOgImage(domain: string | null): boolean {
  if (!domain) return false
  return OG_PREFERRED_DOMAINS.has(domain)
}

export function isTweetUrl(domain: string | null): boolean {
  if (!domain) return false
  return TWEET_DOMAINS.has(domain)
}

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Tabby/1.0 (og-image-fetcher)",
      },
    })
    if (!res.ok) return null

    const html = await res.text()

    // Try og:image first
    const ogMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
    )
    if (ogMatch?.[1]) return ogMatch[1]

    // Try twitter:image
    const twMatch = html.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i
    )
    if (twMatch?.[1]) return twMatch[1]

    return null
  } catch {
    return null
  }
}

export interface TweetData {
  authorName: string
  authorHandle: string
  text: string
  imageUrl: string | null
  avatarUrl?: string | null
}

function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/)
  return match?.[1] || null
}

export async function fetchTweetData(url: string): Promise<TweetData | null> {
  const tweetId = extractTweetId(url)
  if (!tweetId) return null

  try {
    // Use Twitter's syndication API — no auth needed
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`,
      { signal: AbortSignal.timeout(5000) },
    )
    if (!res.ok) return null

    const data = await res.json()

    const authorName: string = data.user?.name || ""
    const authorHandle = data.user?.screen_name ? `@${data.user.screen_name}` : ""

    // Get tweet text, strip t.co links for media
    let text: string = data.text || ""
    // Remove t.co URLs that point to media (pic.twitter.com links)
    const mediaUrls = (data.entities?.media || []).map((m: any) => m.url)
    for (const mediaUrl of mediaUrls) {
      text = text.replace(mediaUrl, "").trim()
    }

    // Get the first image from mediaDetails
    const mediaDetails: any[] = data.mediaDetails || []
    const firstImage = mediaDetails.find((m: any) => m.type === "photo" || m.media_url_https)
    const imageUrl = firstImage?.media_url_https || null

    // Get author avatar
    const avatarUrl: string = data.user?.profile_image_url_https || null

    return {
      authorName,
      authorHandle,
      text,
      imageUrl,
      avatarUrl,
    }
  } catch {
    return null
  }
}
