interface BikeDiscountStore {
  name: string
  url: string
};

interface BikeDiscountCategory {
  name: string
  url: string
  childs: BikeDiscountCategory[]
};

interface BikeDiscountCategorySearch {
  hasNextPage: boolean
  productLinks: string[]
};

interface BikeDiscountAttribute {
  name: string
  value: string[]
  variable?: boolean
};

interface Dimension {
  length: string
  width: string
  height: string
  unit: string
};

interface Weight {
  value: number
  unit: string
}
