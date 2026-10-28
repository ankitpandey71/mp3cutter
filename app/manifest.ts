import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const manifest = (): MetadataRoute.Manifest => ({
  name: siteConfig.title,
  short_name: siteConfig.name,
  description: siteConfig.description,
  start_url: "/",
  display: "standalone",
  background_color: "#07060b",
  theme_color: "#7c3aed",
  categories: ["music", "utilities", "productivity"],
  icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
});

export default manifest;
