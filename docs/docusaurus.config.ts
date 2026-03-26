import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import rehypeCitation from "rehype-citation";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkFigureNumbering from "./plugins/remarkFigureNumbering.mjs";

const config: Config = {
  title: "EnergyIntegrationWebApp",
  tagline: "Documentation for the EnergyIntegration frontend workflow",
  favicon: "img/favicon.ico",
  future: {
    v4: true,
  },
  url: "https://energyintegration.github.io",
  baseUrl: "/EnergyIntegrationWebApp/",
  organizationName: "EnergyIntegration",
  projectName: "EnergyIntegrationWebApp",
  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja"],
    localeConfigs: {
      en: {
        htmlLang: "en-US",
        label: "English",
      },
      ja: {
        htmlLang: "ja",
        label: "日本語",
      },
    },
  },
  stylesheets: [
    "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
  ],
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/EnergyIntegration/EnergyIntegrationWebApp/tree/master/docs",
          remarkPlugins: [remarkMath, remarkFigureNumbering],
          rehypePlugins: [
            rehypeKatex,
            [rehypeCitation, { bibliography: "./references/references.bib" }],
          ],
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      require.resolve("@cmfcmf/docusaurus-search-local"),
      {
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        language: ["en", "ja"],
      },
    ],
  ],
  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "EnergyIntegration",
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          type: "search",
          position: "right",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/EnergyIntegration/EnergyIntegrationWebApp",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Overview",
              to: "/",
            },
            {
              label: "Run the App",
              to: "/webapp/get-started/running-the-app",
            },
          ],
        },
        {
          title: "Project",
          items: [
            {
              label: "Frontend Repo",
              href: "https://github.com/EnergyIntegration/EnergyIntegrationWebApp",
            },
            {
              label: "Backend Repo",
              href: "https://github.com/EnergyIntegration/EnergyIntegrationWebApp.jl",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} EnergyIntegration`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["julia"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
