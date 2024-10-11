import { load } from 'cheerio';

export const purifyHTML = (html: string) => {
  const $ = load(html, null, false);

  $('select[name="tipo_traduccion"], p.select-coment, a[href="javascript:void(0)"], iframe, script, style, form, object, embed, select, input, textarea, button, noscript, li:contains("Garantía"), li:contains("Garantia"), li:contains("Warranty")').remove();

  return $.html().trim().replace(/<a\s+.*?>(.*?)<\/a>/gi, '$1');
};
