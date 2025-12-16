import { COUNTRY_PORTUGAL_ID } from '../../config';

export const PAGE_SIZE = 96;

const getCategoryFilter = (categoryId: string) => ({
  nested: {
    path: 'familias.subfamilias',
    query: {
      terms: {
        'familias.subfamilias.id_subfamilia': [categoryId]
      }
    }
  }
});

const getAttributesFilter = (attributeId: string) => ({
  nested: {
    path: 'atributos_padre.atributos',
    query: {
      bool: {
        should: [
          {
            term: {
              'atributos_padre.atributos.id_atribut_valor': attributeId
            }
          }
        ],
        minimum_should_match: 1
      }
    }
  }
});
// const getCategoriesAggregation = (parentId: string) => {
//   const base = {
//     subfamilias: {
//       nested: {
//         path: 'familias.subfamilias'
//       },
//       aggs: {
//         id_subfamilia: {
//           terms: {
//             field: 'familias.subfamilias.id_subfamilia',
//             size: 1e3
//           }
//         }
//       }
//     }
//   };

//   return {
//     nested: {
//       path: 'familias'
//     },
//     aggs: {
//       filter_id_familia: {
//         filter: {
//           term: {
//             'familias.id_familia': parentId
//           }
//         },
//         aggs: base
//       }
//     }
//   };
// };

// const getBrandsAggregation = (categoryFilter: any) => {
//   const base = {
//     terms: {
//       field: 'marca.keyword',
//       size: 1e3,
//       order: {
//         _key: 'asc'
//       }
//     },
//     aggs: {
//       id_marca: {
//         terms: {
//           field: 'id_marca'
//         }
//       }
//     }
//   };

//   return {
//     filter: {
//       bool: {
//         must: [categoryFilter]
//       }
//     },
//     aggs: {
//       marcas: base
//     }
//   };
// };

// const getSizeAggregation = (categoryFilter: any) => {
//   const base = {
//     nested: {
//       path: 'productes'
//     },
//     aggs: {
//       talla_filter: {
//         filter: {
//           term: {
//             'productes.baja': '0'
//           }
//         },
//         aggs: {
//           talla: {
//             terms: {
//               field: 'productes.talla_filtro.keyword',
//               order: {
//                 _key: 'asc'
//               },
//               size: 1e3
//             }
//           }
//         }
//       }
//     }
//   };

//   return {
//     filter: {
//       bool: {
//         must: [categoryFilter]
//       }
//     },
//     aggs: {
//       tallas: base
//     }
//   };
// };

// const getSize2Aggregation = (categoryFilter: any) => {
//   const base = {
//     nested: {
//       path: 'productes'
//     },
//     aggs: {
//       talla_filter: {
//         filter: {
//           term: {
//             'productes.baja': '0'
//           }
//         },
//         aggs: {
//           talla: {
//             terms: {
//               field: 'productes.talla_filtro2.keyword',
//               order: {
//                 _key: 'asc'
//               },
//               size: 1e3
//             }
//           }
//         }
//       }
//     }
//   };

//   return {
//     filter: {
//       bool: {
//         must: [categoryFilter]
//       }
//     },
//     aggs: {
//       tallas: base
//     }
//   };
// };

const getAttributesAggregation = (categoryFilter: any) => {
  const base = {
    nested: {
      path: 'atributos_padre'
    },
    aggs: {
      id_atributo: {
        terms: {
          field: 'atributos_padre.id_atribut_pare',
          size: 1000
        },
        aggs: {
          valor_atributos: {
            nested: {
              path: 'atributos_padre.atributos'
            },
            aggs: {
              ids_atributos_valor: {
                terms: {
                  field: 'atributos_padre.atributos.id_atribut_valor',
                  size: 1000
                }
              }
            }
          }
        }
      }
    }
  };

  return {
    filter: {
      bool: {
        must: [categoryFilter]
      }
    },
    aggs: {
      atributos: base
    }
  };
};

export const getRequestBody = (pageNumber: number, parentId: string, categoryId: string, includeAggregations: boolean = false, attributeId?: string) => {
  const startFrom = (pageNumber - 1) * PAGE_SIZE;
  const categoryFilter = getCategoryFilter(categoryId);
  const attributesFilter = attributeId ? [getAttributesFilter(attributeId)] : [];

  return {
    from: startFrom,
    size: PAGE_SIZE,
    query: {
      bool: {
        filter: [
          {
            range: {
              image_created: {
                gt: 0
              }
            }
          },
          {
            nested: {
              path: 'productes.sellers',
              query: {
                bool: {
                  must: [
                    {
                      range: {
                        'productes.sellers.stock': {
                          gt: 0
                        }
                      }
                    },
                    {
                      nested: {
                        path: 'productes.sellers.precios_paises',
                        query: {
                          match: {
                            'productes.sellers.precios_paises.id_pais': COUNTRY_PORTUGAL_ID
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          {
            nested: {
              path: 'productes',
              query: {
                term: {
                  'productes.baja': {
                    value: 0
                  }
                }
              }
            }
          }],
        must: [
          {
            nested: {
              path: 'familias',
              query: {
                term: {
                  'familias.id_familia': {
                    value: parentId
                  }
                }
              }
            }
          }
        ],
        must_not: [
          {
            term: {
              paises_prohibidos: COUNTRY_PORTUGAL_ID
            }
          }
        ]
      }
    },
    _source: {
      includes: [
        'model.por',
        'model.eng',
        'image_created',
        'sostenible',
        'fecha_descatalogado',
        'id_marca',
        'video_mp4',
        'tres_sesenta',
        'productes.talla',
        'productes.talla2',
        'id_modelo',
        'familias.id_familia',
        'familias.subfamilias.id_tienda',
        'familias.subfamilias.id_subfamilia',
        'atributos_padre.atributos',
        'productes.baja',
        'productes.id_producte',
        'productes.desc_brand',
        'productes.brut',
        'productes.exist',
        'productes.pmp',
        'productes.rec',
        'productes.stock_reservat',
        'productes.v30',
        'productes.v90',
        'productes.v180',
        'productes.v360',
        'productes.ean',
        'id_subfamilia_principal',
        'productes.color',
        `id_producte_pais_win.${COUNTRY_PORTUGAL_ID}`,
        `precio_win_${COUNTRY_PORTUGAL_ID}`,
        'marca',
        'productes.sellers.id_seller',
        'productes.sellers.precios_paises'
      ]
    },
    sort: [{
      v30_sum: {
        order: 'desc'
      }
    }],
    post_filter: {
      bool: {
        filter: [categoryFilter, ...attributesFilter]
      }
    },
    ...(includeAggregations && {
      aggregations: {
        group_by_atributos: getAttributesAggregation(categoryFilter)
      }
    })
    // aggregations: {
    //   group_by_marca: getBrandsAggregation(categoryFilter),
    //   group_by_categorias: categoriesAggregation,
    //   group_by_tallas: getSizeAggregation(categoryFilter),
    //   group_by_tallas_2: getSize2Aggregation(categoryFilter),
    //   group_by_atributos: getAttributesAggregation(categoryFilter)
    // }
  };
};
