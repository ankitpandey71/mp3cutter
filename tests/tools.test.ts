import { describe, expect, it } from "vitest";
import { getToolBySlug, icons, mp3Cutter, tools } from "@/lib/tools";
import { effectConfigs } from "@/components/processor/effects";

const slugOf = (tool: { path: string }) => tool.path.slice(1);

describe("tool registry", () => {
  it("has no duplicate routes or names", () => {
    expect(new Set(tools.map((t) => t.path)).size).toBe(tools.length);
    expect(new Set(tools.map((t) => t.name)).size).toBe(tools.length);
  });

  it("starts with the home cutter", () => {
    expect(tools[0]).toBe(mp3Cutter);
    expect(mp3Cutter.path).toBe("/");
  });

  it("uses lowercase hyphenated slugs", () => {
    for (const tool of tools.filter((t) => t.path !== "/")) {
      expect(tool.path, tool.name).toMatch(/^\/[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("resolves every slug back to its tool", () => {
    for (const tool of tools.filter((t) => t.path !== "/")) {
      expect(getToolBySlug(slugOf(tool))).toBe(tool);
    }
    expect(getToolBySlug("not-a-tool")).toBeUndefined();
  });

  it("points every effect-backed tool at a real effect config", () => {
    for (const tool of tools) {
      if (tool.effect) expect(effectConfigs[tool.effect], tool.name).toBeDefined();
    }
  });

  it("references icons that exist in the icon set", () => {
    const paths = new Set(Object.values(icons));
    for (const tool of tools) {
      expect(paths.has(tool.icon), `${tool.name} icon`).toBe(true);
      for (const feature of tool.features) {
        expect(paths.has(feature.icon), `${tool.name} feature icon`).toBe(true);
      }
    }
  });
});

describe("tool SEO content", () => {
  it("keeps titles and descriptions inside search-result limits", () => {
    for (const tool of tools) {
      expect(tool.metaTitle.length, `${tool.name} title`).toBeLessThanOrEqual(70);
      expect(tool.metaTitle.length).toBeGreaterThan(10);
      expect(tool.description.length, `${tool.name} description`).toBeGreaterThan(70);
      expect(tool.description.length, `${tool.name} description`).toBeLessThanOrEqual(165);
    }
  });

  it("ships keywords, steps and FAQs for every tool", () => {
    for (const tool of tools) {
      expect(tool.keywords.length, tool.name).toBeGreaterThanOrEqual(3);
      expect(tool.steps.length, tool.name).toBeGreaterThanOrEqual(3);
      expect(tool.faqs.length, tool.name).toBeGreaterThanOrEqual(3);
      expect(tool.features.length, tool.name).toBeGreaterThanOrEqual(3);
    }
  });

  it("writes every FAQ as a question with a substantive answer", () => {
    for (const tool of tools) {
      for (const faq of tool.faqs) {
        expect(faq.question.endsWith("?"), `${tool.name}: ${faq.question}`).toBe(true);
        expect(faq.answer.length, `${tool.name}: ${faq.question}`).toBeGreaterThan(40);
      }
    }
  });

  it("uses lowercase keywords with no duplicates per tool", () => {
    for (const tool of tools) {
      const keywords = tool.keywords.map((k) => k.toLowerCase());
      expect(new Set(keywords).size, tool.name).toBe(keywords.length);
      expect(tool.keywords, tool.name).toEqual(keywords);
    }
  });
});
