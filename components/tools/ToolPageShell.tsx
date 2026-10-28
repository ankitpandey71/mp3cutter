import type { ReactNode } from "react";
import Link from "next/link";
import AdSlot from "@/components/ads/AdSlot";
import { siteConfig } from "@/lib/site";
import { tools, type Tool } from "@/lib/tools";

interface ToolPageShellProps {
  tool: Tool;
  children: ReactNode;
}

const ToolIcon = ({ path, className = "h-5 w-5" }: { path: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const buildJsonLd = (tool: Tool) => {
  const url = `${siteConfig.url}${tool.path === "/" ? "" : tool.path}`;
  const isHome = tool.path === "/";
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...(isHome
        ? [
            {
              "@type": "WebSite",
              "@id": `${siteConfig.url}/#website`,
              name: siteConfig.name,
              url: siteConfig.url,
              description: siteConfig.description,
              inLanguage: "en",
            },
          ]
        : [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
                { "@type": "ListItem", position: 2, name: tool.name, item: url },
              ],
            },
          ]),
      {
        "@type": "WebApplication",
        name: isHome ? siteConfig.name : `${tool.name} — ${siteConfig.name}`,
        url,
        description: tool.description,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any (runs in a web browser)",
        browserRequirements: "Requires JavaScript and the Web Audio API",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: tool.features.map((f) => f.title),
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
};

const ToolPageShell = ({ tool, children }: ToolPageShellProps) => {
  const relatedTools = tools.filter((t) => t.path !== tool.path);

  return (
    <div className="flex flex-1 flex-col items-center gap-16 px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(tool)).replace(/</g, "\\u003c") }}
      />

      <div className="animate-float-up max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
          </span>
          {tool.badge}
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
          {tool.heading.before} <span className="text-gradient">{tool.heading.highlight}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
          {tool.intro}
        </p>
      </div>

      <div className="animate-float-up w-full [animation-delay:120ms]">{children}</div>

      <section className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
        {tool.features.map((f) => (
          <div key={f.title} className="glass-card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/15 to-fuchsia-500/15 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-300">
              <ToolIcon path={f.icon} />
            </span>
            <p className="mt-4 font-semibold text-zinc-900 dark:text-white">{f.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.body}</p>
          </div>
        ))}
      </section>

      <div className="w-full max-w-5xl">
        <AdSlot slot={`${tool.path === "/" ? "home" : tool.path.slice(1)}-footer`} />
      </div>

      <section className="w-full max-w-5xl">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {tool.stepsTitle}
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tool.steps.map((s, i) => (
            <li key={s.title} className="glass-card p-5">
              <span className="font-mono text-xs font-medium text-violet-600 dark:text-violet-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="w-full max-w-3xl" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Frequently asked questions
        </h2>
        <div className="mt-8 flex flex-col gap-3">
          {tool.faqs.map((faq) => (
            <details key={faq.question} className="glass-card group rounded-2xl! px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-zinc-900 dark:text-white [&::-webkit-details-marker]:hidden">
                <h3>{faq.question}</h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-zinc-400 transition group-open:rotate-45">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="w-full max-w-5xl" aria-labelledby="more-tools-heading">
        <h2 id="more-tools-heading" className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          More free audio tools
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {relatedTools.map((t) => (
            <ToolCard key={t.path} tool={t} />
          ))}
        </div>
      </section>
    </div>
  );
};

export const ToolCard = ({ tool }: { tool: Tool }) => (
  <Link
    href={tool.path}
    className="glass-card group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:ring-1 hover:ring-violet-500/30"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25">
      <ToolIcon path={tool.icon} />
    </span>
    <span className="min-w-0">
      <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
        {tool.name}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-violet-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </span>
      <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">{tool.tagline}</span>
    </span>
  </Link>
);

export default ToolPageShell;
