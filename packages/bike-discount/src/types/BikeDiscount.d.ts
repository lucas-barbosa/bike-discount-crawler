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

type BikeDiscountAttribute = {
  name: string;
  value: string[];
  variable?: boolean;
}

type Dimension = {
  length: string;
  width: string;
  height: string;
  unit: string;
}

type Weight = {
  value: number;
  unit: string;
}