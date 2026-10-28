import type { Metadata } from "next";

const resolveSiteUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
};

export const siteConfig = {
  name: "SnipAudio",
  url: resolveSiteUrl().replace(/\/$/, ""),
  title: "SnipAudio — Free Online MP3 Cutter & Audio Trimmer (No Upload)",
  description:
    "Cut, trim, and export MP3, WAV, OGG, M4A, AAC and FLAC files for free, right in your browser. No uploads, no signup, no watermark — add fade in/out and download as MP3 or WAV.",
  keywords: [
    "mp3 cutter",
    "online mp3 cutter",
    "audio cutter",
    "audio trimmer",
    "trim mp3",
    "cut mp3 online",
    "ringtone maker",
    "wav cutter",
    "free audio editor",
    "cut audio without upload",
  ],
};

// Child segments replace (not merge) openGraph/twitter, so each page rebuilds them in full
export const pageMetadata = ({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata => ({
  title,
  description,
  keywords,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${title} | ${siteConfig.name}`,
    description,
    url: path,
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${siteConfig.name}`,
    description,
    images: ["/opengraph-image"],
  },
});
