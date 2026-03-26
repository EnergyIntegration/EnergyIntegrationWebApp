import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "index",
    {
      label: "EnergyIntegration",
      type: "category",
      items: [
        {
          label: "Get Started",
          type: "category",
          items: [
            "energyintegration/get-started/creating-streams",
            "energyintegration/get-started/intervals-config",
            "energyintegration/get-started/build-hen",
            "energyintegration/get-started/plot-composite",
          ],
          key: "energyintegration-get-started",
          collapsed: false,
        },
        {
          label: "Reference",
          type: "category",
          items: [
            "energyintegration/reference/core-library",
          ],
          key: "energyintegration-reference",
          collapsed: false,
        },
      ],
      className: "sidebar-section",
      collapsed: false,
    },
    {
      label: "WebApp",
      type: "category",
      items: [
        {
          label: "Get Started",
          type: "category",
          items: [
            "webapp/get-started/creating-streams",
            "webapp/get-started/running-the-app",
          ],
          key: "webapp-get-started",
          collapsed: false,
        },
        {
          label: "Guides",
          type: "category",
          items: [
            "webapp/guides/build-solve-results",
          ],
          key: "webapp-guides",
          collapsed: false,
        },
        {
          label: "Reference",
          type: "category",
          items: [
            "webapp/reference/frontend-backend-contract",
          ],
          key: "webapp-reference",
          collapsed: false,
        },
      ],
      className: "sidebar-section",
      collapsed: false,
    },
    {
      label: "Architecture",
      type: "category",
      items: [
        "architecture/system-overview",
      ],
      className: "sidebar-section",
      collapsed: false,
    },
  ],
};

export default sidebars;
