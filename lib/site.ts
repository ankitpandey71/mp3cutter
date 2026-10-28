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

export const faqs = [
  {
    question: "Is SnipAudio really free?",
    answer:
      "Yes. Cutting, fading and exporting are completely free with no watermark, no signup and no limit on the number of files.",
  },
  {
    question: "Are my audio files uploaded to a server?",
    answer:
      "No. Your file is decoded, trimmed and encoded entirely inside your browser using the Web Audio API. It never leaves your device.",
  },
  {
    question: "Which audio formats can I cut?",
    answer:
      "You can open MP3, WAV, OGG, M4A, AAC and FLAC files (anything your browser can decode), and export the result as MP3 (128–320 kbps) or lossless WAV.",
  },
  {
    question: "How do I make a ringtone from a song?",
    answer:
      "Drop the song in, drag the waveform handles around the 20–30 second part you want, add a short fade in and fade out, then click “Cut & Download”.",
  },
  {
    question: "Does it work on phones and tablets?",
    answer:
      "Yes. SnipAudio runs in any modern browser on Android, iPhone, iPad, Windows, macOS and Linux — there is nothing to install.",
  },
];

// Child segments replace (not merge) openGraph/twitter, so each page rebuilds them in full
export const pageMetadata = ({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata => ({
  title,
  description,
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
