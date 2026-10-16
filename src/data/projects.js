/**
 * Concept projects. These are self-initiated explorations created to show
 * range and thinking — they are not client engagements.
 */
export const projects = [
  {
    id: 'vanta',
    aspect: '5 / 6',
    index: '01',
    name: 'VANTA',
    category: 'Fashion e-commerce',
    year: '2026',
    tagline: 'A storefront that behaves like a lookbook.',
    theme: { bg: '#E7E2D8', fg: '#121110', accent: '#7A1F1F' },
    summary:
      'A concept for a premium fashion label that wanted its online store to feel as considered as its runway shows — editorial pacing first, catalogue second.',
    challenge:
      'Luxury storefronts tend to fall into one of two traps: beautiful but slow to shop, or efficient but indistinguishable from a marketplace.',
    approach: [
      'Product pages composed like magazine spreads, with typography that scales to the garment.',
      'A persistent, minimal bag that never interrupts browsing.',
      'Colourway switching that re-tints the whole page, not just the product photo.',
    ],
    scope: ['Art direction', 'E-commerce UX', 'Design system', 'Frontend build'],
    stack: ['React', 'Headless commerce', 'Motion system'],
  },
  {
    id: 'orbit',
    aspect: '3 / 4',
    index: '02',
    name: 'ORBIT',
    category: 'SaaS platform',
    year: '2026',
    tagline: 'Workflow software with a sense of gravity.',
    theme: { bg: '#0E6B52', fg: '#ECF7F0', accent: '#FFFFFF' },
    summary:
      'A concept marketing site and product shell for a scheduling platform that coordinates distributed teams across time zones.',
    challenge:
      'Explaining an abstract product — coordination — without leaning on screenshots that date the moment the UI ships an update.',
    approach: [
      'An orbital visual language: every team, task and time zone is a body with its own path.',
      'Interactive diagrams that let visitors drag a meeting across time zones and watch the system respond.',
      'A modular page builder so the marketing team can ship new pages without a developer.',
    ],
    scope: ['Brand extension', 'Marketing site', 'Product UI', 'Interaction design'],
    stack: ['React', 'SVG animation', 'CMS-ready components'],
  },
  {
    id: 'monolith',
    aspect: '16 / 8.5',
    index: '03',
    name: 'MONOLITH',
    category: 'Architecture & interiors',
    year: '2025',
    tagline: 'Weight, light and silence — in a browser.',
    theme: { bg: '#B9B6AE', fg: '#141414', accent: '#141414' },
    summary:
      'A concept portfolio for an architecture practice whose buildings are defined by mass and shadow rather than ornament.',
    challenge:
      'Architectural photography loses its scale on a screen. The site had to communicate material and proportion, not just show pictures.',
    approach: [
      'A layout grid derived from the practice’s own modular building unit.',
      'Shadow studies that shift with scroll position, mimicking a day passing over a facade.',
      'Project pages structured as walkthroughs: approach, threshold, interior, detail.',
    ],
    scope: ['Concept', 'Portfolio UX', 'Scroll storytelling', 'Frontend build'],
    stack: ['React', 'CSS 3D transforms', 'Image pipeline'],
  },
  {
    id: 'pulse',
    aspect: '1 / 1',
    index: '04',
    name: 'PULSE',
    category: 'Product & analytics',
    year: '2025',
    tagline: 'Dashboards people actually read.',
    theme: { bg: '#101112', fg: '#F4F5F0', accent: '#FF5A1F' },
    summary:
      'A concept analytics product for small e-commerce teams who need answers, not another wall of charts.',
    challenge:
      'Most dashboards show everything at once. Small teams need to know what changed, why it matters and what to do next.',
    approach: [
      'A narrative overview that surfaces the three changes that matter today.',
      'Charts with built-in annotations instead of tooltips you have to hunt for.',
      'Keyboard-first navigation and a dense mode for power users.',
    ],
    scope: ['Product strategy', 'Dashboard UX', 'Data visualisation', 'Component library'],
    stack: ['React', 'Canvas charts', 'Accessible tables'],
  },
];
