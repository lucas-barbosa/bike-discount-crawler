import { Product } from "./Product";
import { ProductStock } from "./ProductStock";
import { ProductTranslation } from "./ProductTranslation";

export type CategoriesFoundCallback = (categories: any) => Promise<any>;
export type ProductFoundCallback = (product: Product) => Promise<any>;
export type StockFoundCallback = (stock: ProductStock) => Promise<any>;
export type TranslationFoundCallback = (translation: ProductTranslation) => Promise<any>;

export type QueueParams = {
  onCategoriesFound: CategoriesFoundCallback;
  onProductFound: ProductFoundCallback;
  onProductImageFound?: ProductFoundCallback;
  onStockFound: StockFoundCallback;
  onTranslationFound: TranslationFoundCallback;
};

export type ProductQueueItem = {
  url: string;
  categoryUrl: string;
  language?: string;
};

export type StockQueueItem = {
  url: string;
};

export type TranslationQueueItem = {
  url: string;
  language: string;
};

export type CategoryQueueItem = {
  categoryUrl: string;
  page?: number;
};
