import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";

const pages: MetadataRoute.Sitemap = [
  ...tools.map((tool) => ({
    url: `${siteConfig.url}${tool.path === "/" ? "" : tool.path}`,
    changeFrequency: "weekly" as const,
    priority: tool.path === "/" ? 1 : 0.9,
  })),
  { url: `${siteConfig.url}/tools`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${siteConfig.url}/about`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteConfig.url}/monetization`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${siteConfig.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
];

const sitemap = (): MetadataRoute.Sitemap =>
  pages.map((page) => ({ ...page, lastModified: new Date() }));

export default sitemap;
