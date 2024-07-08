import axios from 'axios';
import { load } from 'cheerio';
import { type Category } from '@crawlers/base/dist/types/Category';
import { addPrefixIfRelative } from '@crawler/utils/url';

interface BarrabesCategory extends Category {
  isParent?: boolean
}

export const listCategories = async (): Promise<Category[]> => {
  const url = 'https://www.barrabes.com/pt';
  const { data } = await axios.get(url);
  const $ = load(data);

  const elements = $('#menu-inferior-ul li:not(.nav-brands) button.nav-anchor, #menu-inferior-ul .nav--level-2 .nav-link a');

  const promises = elements.map(async (i, element): Promise<BarrabesCategory> => {
    const $element = $(element);
    const isParent = $element.is('button');
    const name = $element.text().trim();
    const url = $element.attr('href');

    if (isParent || !url) {
      return {
        name,
        isParent,
        url: '',
        childs: []
      };
    }
    const formattedUrl = addPrefixIfRelative(url);
    return {
      name,
      url: formattedUrl,
      childs: await getSubcategories(formattedUrl)
    };
  });

  const categories = await Promise.all(promises);
  return makeCategoriesTree(categories);
};

export const listProCategories = async (): Promise<Category[]> => {
  const url = 'https://www.barrabes.com/gama-profesionales/c-1406';
  const categories = await getSubcategories(url);
  return makeCategoriesTree(categories);
};

const getSubcategories = async (subcategoryUrl: string) => {
  const { data } = await axios.get(subcategoryUrl);
  const $ = load(data);
  const elements = $('#filter-cat a.lnkCat, #filter-cat ul.subc a');
  const promises = elements.map(async (i, element): Promise<BarrabesCategory> => {
    const $element = $(element);
    const name = $element.text().trim();
    const url = $element.attr('href');
    const formattedUrl = addPrefixIfRelative(url ?? '');
    const isParent = $element.hasClass('cat');
    const childs = !$element.hasClass('lnkCat') ? await getSubcategories(formattedUrl) : [];
    return {
      name,
      isParent,
      childs,
      url: formattedUrl
    };
  });
  return Promise.all(promises);
};

const makeCategoriesTree = (categories: BarrabesCategory[]) => {
  const categoriesTree: Category[] = [];
  let categoriesTemp = [];

  for (let i = categories.length - 1; i >= 0; i--) {
    const barrabesCategory = categories[i];
    const category = {
      url: barrabesCategory.url,
      childs: barrabesCategory.childs,
      name: barrabesCategory.name
    };

    if (barrabesCategory.isParent) {
      category.childs = categoriesTemp;
      categoriesTemp = [];
      categoriesTree.unshift(category);
    } else {
      categoriesTemp.unshift(category);
    }
  }

  return categoriesTree;
};
