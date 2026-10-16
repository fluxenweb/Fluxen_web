/**
 * Starting prices in Uzbek sum. Titles and descriptions live in src/i18n.
 * `type` pre-selects the matching option in the contact form.
 */
export const plans = [
  { id: 'corporate', index: '01', price: '4 990 000', type: 'website' },
  { id: 'ecommerce', index: '02', price: '7 990 000', type: 'ecommerce' },
  { id: 'mobile', index: '03', price: '12 999 000', type: 'mobile' },
  { id: 'crm', index: '04', price: '20 000 000', type: 'app', featured: true },
];

/** Fired when a price row is chosen, so the contact form can pre-select the project type. */
export const BRIEF_EVENT = 'fluxen:brief';
