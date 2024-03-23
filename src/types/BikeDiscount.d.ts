type BikeDiscountStore = {
  name: string;
  url: string;
}

type BikeDiscountCategory = {
  name: string;
  url: string;
  childs: BikeDiscountCategory[];
}

type BikeDiscountCategorySearch = {
  hasNextPage: boolean;
  productLinks: string[];
}