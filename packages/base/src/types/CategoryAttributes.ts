export interface CategoryAttribute {
  categoryId: string;
  parentId: string;
  url: string;
  attributes: {
    id: string
    label: string
    values: {
      id: string
      name: string
    }[]
  }[]
}
