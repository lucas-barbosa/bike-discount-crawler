<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

use LucasBarbosa\LbCrawlersReceiver\Utils\Utils;

class BikeDiscountHelper {
	// public static $IS_RUNNING = false;
  private array $taxonomies = [];
	private array $translatedAttributes = [];
  private string $stock = '';
  
  // public function setHooks() {
  //   add_action( 'lb_bike_discount_crawler_product_loaded', array( $this, 'execute' ) );
  // }

	protected function loadParams( $stockName ) {
		$this->stock = get_option( $stockName, '' );
	}

  // public function execute( ProductEntity $productData ) {
	// 	if ( $productData->getInvalid() ) {
	// 		$this->deleteProductIfExists( $productData );
	// 		return;
	// 	}

	// 	self::$IS_RUNNING = true;

	// 	$this->loadParams();

  //   $result = $this->getWoocommerceProduct( $productData->getId(), $productData->getSku(), $productData->isVariable() );
	// 	$product = $result[0];
	// 	$is_new_product = $result[1];

  //   $product = $this->setRequiredData( $product, $productData );
		
  //   $this->saveProduct( $product, true, $productData->getPrice(), $productData->getAvailability() );
	// 	$this->setCustomMetaData( $product, $productData );
		
	// 	if ( ! $this->checkProductWasAddedManually( $product ) ) {
	// 		$this->setAdditionalData( $product, $productData );
	// 		$this->setEnglishData( $product, $productData );
	// 		$this->setSyncData( $product, $is_new_product );
		
	// 		do_action( 'lb_bike_discount_product_created', [ $product->get_id(), $productData->getParentStoreProps() ]);
	// 	}

	// 	$this->setCrossSelledProducts( $product, $productData->getUrl(), $productData->getCrossSelledProducts() );

	// 	self::$IS_RUNNING = false;
  // }

  // private function addBrand( $brandName ) {
	// 	$terms_to_add = [];

	// 	$matchingBrand = get_term_by( 'name', $brandName, 'product_brand' );

  //   if ( ! empty( $matchingBrand->term_id ) ) {
  //     $terms_to_add[] = (int) $matchingBrand->term_id;
  //   } else {
	// 		$id = wp_insert_term( $brandName, 'product_brand' );

  //     if ( ! is_wp_error( $id ) ) {
  //       $terms_to_add[] = $id['term_id'];
	// 		}
	// 	}

	// 	return $terms_to_add;
	// }

  // private function addCategories( $bikeDiscountCategories ) {
	// 	if ( ! is_array( $bikeDiscountCategories ) ) {
	// 		$bikeDiscountCategories = [];
	// 	}
		
  //   $parentId = SettingsData::getParentCategory();
	// 	$categoryIds = array();

  //   if ( empty( $parentId ) ) {
  //     $parentId = 0;
  //   } else {
  //     $categoryIds[] = $parentId;
  //   }
    
	// 	foreach ( $bikeDiscountCategories as $categoryName ) {
	// 		$parentName = $parentId !== 0 ? "$parentId-" : '';

	// 		$categoryCacheName = $parentName . $categoryName;
	// 		$categoryExists = IdMapper::getTermId( $categoryCacheName );
	// 		$parentName .= $categoryName . '_';

  //     if ( $categoryExists ) {
  //       $parentId = $categoryExists;
  //       $categoryIds[] = $parentId;
  //       continue;
  //     }

	// 		$translatedCategoryName = Utils::translate( $categoryName, 'en', 'pt-BR', false, 'term', 'title' );

  //     $terms = get_terms( 'product_cat', array(
  //       'name' => $translatedCategoryName,
  //       'parent' => $parentId,
  //       'hide_empty' => false,
  //     ) );
				
  //     if ( ! is_wp_error( $terms ) && count( $terms ) > 0 ) {
  //       $category = array(
  //         'term_id' => $terms[0]->term_id,
  //         'name' 		=> $terms[0]->name,
  //         'slug' 		=> $terms[0]->slug,
  //         'parent' 	=> $terms[0]->parent,
  //       );
  //     } else {
  //       $category = wp_insert_term(
  //         $translatedCategoryName,
  //         'product_cat',
  //         array(
  //           'description' => '',
  //           'parent' => $parentId
  //         )
  //       );
  //     }

  //     if ( ! is_wp_error( $category ) && isset( $category['term_id'] ) ) {
	// 			IdMapper::setTermId( $category['term_id'], $categoryCacheName );

  //       $parentId = $category['term_id'];
  //       $categoryIds[] = $parentId;
	// 		}
	// 	}
		
	// 	return array_unique( $categoryIds );
	// }

  // private function addImages( $imageUrls ) {
	// 	static $images = array();
		
	// 	$imageIds = array();
		
	// 	if ( $imageUrls ) {
	// 		foreach ( $imageUrls as $imageUrl ) {
	// 			$key = base64_encode( $imageUrl );

	// 			if ( isset( $images[$key] ) ) {
	// 				$imageIds[] = $images[$key];
	// 			} else {				
	// 				$id = Utils::uploadAttachment( $imageUrl, $key );

	// 				if ( $id ) {
	// 					$images[$key] = $id;
	// 					$imageIds[] = $id;
	// 				}					
	// 			}
	// 		}
	// 	}
				
	// 	return $imageIds;
	// }

  protected function addTaxonomyIfNotExists( $taxonomyLabel, $taxonomySlug, $values = array() ) {
		$attribute_id = $this->getAttributeTaxonomyId( $taxonomyLabel );

		if ( ! is_wp_error( $attribute_id ) && $values ) {
			$taxonomy = wc_attribute_taxonomy_name_by_id( (int) $attribute_id );

			foreach ( $values as $item ) {
				$value = is_array( $item )
          ? $item['value']
          : $item;
				$itemId = ! empty( $item['id'] )
          ? $item['id']
          : $taxonomyLabel . ':' . $value;

				if ( ! empty( $itemId ) && BikeDiscountIdMapper::getTermId( $itemId ) ) {
          continue;
        }

				$originalValue = $value;

				if ( is_array( $item ) && isset( $item['translated_value'] ) && ! empty( $item['translated_value'] ) ) {
					$value = $item['translated_value'];
				}

        $term = term_exists( $value, $taxonomy );

				if ( ! $term ) {
					$term = wp_insert_term( $value, $taxonomy );
				}

        if ( ! is_wp_error( $term ) && isset( $term['term_id'] ) && ! empty( $itemId ) ) {
          BikeDiscountIdMapper::setTermId( $term['term_id'], $itemId );
					do_action( 'lb_multi_language_translate_term', $term['term_id'], 'ingles', trim( $originalValue ), '', sanitize_title( $originalValue ) );
        }        
			}

      $this->taxonomies[ $taxonomySlug ] = $taxonomy;
		}

		return $taxonomy;
	}

	// private function checkProductWasAddedManually( $product, $productId = '' ) {
	// 	if ( empty($product) ) {
	// 		if (!empty($productId)) {
	// 			return !empty( CrawlerPostMetaData::get( $productId, '_lb_bike_discount_attributes' ) )
	// 				|| !empty( CrawlerPostMetaData::get( $productId, '_lb_bike_discount_url' ) );
	// 		}

	// 		return false;
	// 	}

	// 	return ! empty( CrawlerPostMetaData::get( $product->get_id(), '_lb_bike_discount_attributes') )
	// 		|| ! empty( CrawlerPostMetaData::get( $product->get_id(), '_lb_bike_discount_url') );
	// }

  // private function createVariations( $product, array $variations ) {
  //   $existentVariations = $product->get_children( array(
	// 		'fields'      => 'ids',
	// 		'post_status' => array( 'publish', 'private' )
	// 	), ARRAY_A );

	// 	$syncedVariations = [];

	// 	try {
	// 		foreach ( $variations as $i => $variation ) {
	// 			if ( $variation->getInvalid() ) {
	// 				continue;
	// 			}

	// 			$syncedVariations[] = $this->createVariation( $i, $product, $variation );
	// 		}
	// 	} catch ( Exception $e ) {
	// 		/**
	// 		 * TO-DO: add log
	// 		 */
	// 	}

	// 	$this->deleteNonUsedVariations( $existentVariations, $syncedVariations );
	// }

	public function createVariation( $i, $wc_product, $variation ) {
		$attributes = $this->getWoocommerceVariationAttributes( $variation );

		$wc_variation = $this->getWoocommerceVariation( $variation['id'], $wc_product, $attributes );
		$wc_variation->set_parent_id( $wc_product->get_id() );

		$variationSku = empty( $variation['id'] )
			? $wc_product->get_sku() . '-' . (string)$i . time()
			: 'BD-' . $variation['id'];

		$wc_variation->set_sku( $variationSku );

		CrawlerPostMetaData::insert( $wc_variation->get_id(), 'variation_id_' . $variation['id'], $variation['id'] );
		$wc_variation->set_attributes( $attributes );

		$price = $variation['price'];
    $stock = $variation['availability'];

		$this->setPriceAndStock( $wc_variation, $price, $stock );
		$this->saveProduct( $wc_variation, true, $price, $stock );

		return $wc_variation->get_id();
	}

	protected function deleteNonUsedVariations( $existentVariations, $newVariations ) {
		if ( ! empty( $existentVariations ) ) {
			foreach ( $existentVariations as $variationId ) {
				if ( ! in_array( $variationId, $newVariations ) ) {
					wp_delete_post( $variationId, true );
				}
			}
		}
	}

	// private function deleteProductIfExists( ProductEntity $product ) {
	// 	$productId = IdMapper::getProductId( $product->getId() );

	// 	if ( $productId ) {
	// 		if ( $this->checkProductWasAddedManually( null, $productId ) ) {
	// 			return;
	// 		}

	// 		wp_delete_post( $productId, true );
	// 		do_action( 'lb_bike_discount_product_deleted', $productId );
	// 	}
	// }

  private function getAttributeTaxonomyId( $taxonomyLabel ) {
    // TODO -> use custom table
		$id = $taxonomyLabel;
		$storedValue = empty( $id ) ? '' : BikeDiscountIdMapper::getAttributeId( $id );

		if ( ! empty( $storedValue ) ) {
			return $storedValue;
		}

		$optionName = 'bike_discount_' . $taxonomyLabel;
		$attributeIdFromCache = get_option( $optionName, '' );

		if ( ! empty( $attributeIdFromCache ) && ! is_null( wc_get_attribute( $attributeIdFromCache ) ) ) {
			BikeDiscountIdMapper::setAttributeId( $id, $attributeIdFromCache );
			return $attributeIdFromCache;
		}

		$attributeIdFromCache = get_option( 'sp' . $taxonomyLabel, '' );

		if ( ! empty( $attributeIdFromCache ) && ! is_null( wc_get_attribute( $attributeIdFromCache ) ) ) {
			BikeDiscountIdMapper::setAttributeId( $id, $attributeIdFromCache );
			return $attributeIdFromCache;
		}

		$translatedTaxonomyLabel = $taxonomyLabel === 'Model' ? 'Modelo' : Utils::translate( $taxonomyLabel, 'en', 'pt-BR', false, 'attribute', 'title' );
		$translatedTaxonomySlug = wc_attribute_taxonomy_name( wc_sanitize_taxonomy_name( stripslashes( $translatedTaxonomyLabel ) ) );
		$attributeFromSlug = wc_attribute_taxonomy_id_by_name( $translatedTaxonomySlug );

		if ( $attributeFromSlug ) {
			BikeDiscountIdMapper::setAttributeId( $id, $attributeFromSlug );
			update_option( 'sp' . $taxonomyLabel, $attributeFromSlug, false );
			return $attributeFromSlug;
		}

		$attribute_labels = wp_list_pluck( wc_get_attribute_taxonomies(), 'attribute_label', 'attribute_name' );
		$attribute_name   = array_search( $translatedTaxonomyLabel, $attribute_labels, true );

		$attributeFromLabel = wc_attribute_taxonomy_id_by_name( $attribute_name );

		if ( $attributeFromLabel ) {
			BikeDiscountIdMapper::setAttributeId( $id, $attributeFromLabel );
			update_option( 'sp_bike_discount_' . $taxonomyLabel, $attributeFromLabel, false );
			return $attributeFromLabel;
		}
		
		$attribute_name = wc_sanitize_taxonomy_name( trim(substr($translatedTaxonomyLabel, 0, 27)) );

		$attribute_id = wc_create_attribute(
			array(
				'name'         => $translatedTaxonomyLabel,
				'slug'         => $translatedTaxonomySlug,
				'type'         => 'select',
				'order_by'     => 'menu_order',
				'has_archives' => false,
			)
		);

		if ( !is_wp_error( $attribute_id ) ) {
			do_action( 'lb_multi_language_translate_term', $attribute_id, 'ingles', trim( $taxonomyLabel ), '', sanitize_title( $taxonomyLabel ) );

			$taxonomy_name = wc_attribute_taxonomy_name( $attribute_name );

			register_taxonomy(
				$taxonomy_name,
				apply_filters( 'woocommerce_taxonomy_objects_' . $taxonomy_name, array( 'product' ) ),
				apply_filters(
					'woocommerce_taxonomy_args_' . $taxonomy_name,
					array(
						'label' 			 => $translatedTaxonomyLabel,
						'hierarchical' => false,
						'show_ui'      => false,
						'query_var'    => true,
						'rewrite'      => false,
					)
				)
			);
		}

		BikeDiscountIdMapper::setAttributeId( $id, $attribute_id );
		update_option( $optionName, $attribute_id, false );
		
		return $attribute_id;
	}

  protected function getProductId($id, $sku) {
    $productId = BikeDiscountIdMapper::getProductId( $id );

    if ( ! empty( $productId ) ) {
      return $productId;
    }

    $id_by_sku = wc_get_product_id_by_sku('BD-' . $sku);

    if (!empty($id_by_sku)) {
      return $id_by_sku;
    }

    return null;
  }

  protected function getVariationId( $bikeDiscountVariationId, $variationAttributes, $wc_product ) {
    $variationId = BikeDiscountIdMapper::getVariationId( $bikeDiscountVariationId );
		if ( ! empty( $variationId ) ) {	
      return $variationId;
    }

    $variationIdBySku = wc_get_product_id_by_sku('BD-' . $bikeDiscountVariationId);
    if ( ! empty( $variationIdBySku ) ) {
      return $variationIdBySku;
    }

		$variationIdByAttribute = $this->getVariationIdByAttributes( $wc_product, $variationAttributes );
    if ( ! empty( $variationIdByAttribute ) ) {
      return $variationIdByAttribute;
    }

    return null;
  }

  private function getVariationIdByAttributes( $product, $variationAttributes ) {
		$data_store = \WC_Data_Store::load( 'product' );

    $attributes = [];

    foreach ( $variationAttributes as $key => $value ) {
      $attributes[ 'attribute_' . $key ] = $value;
    }

		return $data_store->find_matching_product_variation( $product, $attributes );
	}

  // private function getWoocommerceProduct( string $id, string $sku, bool $isVariable ) {
  //   $productId = IdMapper::getProductId( $id );
	// 	$new_product = true;

  //   if ( empty( $productId ) ) {
  //     $productId = wc_get_product_id_by_sku( $sku );
  //   }

	// 	if ( $productId ) {
	// 		$new_product = false;
	// 		$product = wc_get_product( $productId );		

	// 		if ( $product && 0 < $product->get_parent_id() ) {
	// 			$productId = $product->get_parent_id();
	// 		}
	// 	}

  //   if ( $isVariable ) {
	// 		return [new \WC_Product_Variable((int) $productId ), $new_product];
	// 	}

	// 	return [new \WC_Product((int) $productId ), $new_product];
  // }

  protected function getWoocommerceProduct( string $id, string $sku, bool $isVariable ) {
    $productId = $this->getProductId( $id, $sku );
		$new_product = true;

		if ( $productId ) {
			$new_product = false;
			$product = wc_get_product( $productId );		

			if ( $product && 0 < $product->get_parent_id() ) {
				$productId = $product->get_parent_id();
			}
		}

    if ( $isVariable ) {
			return [new \WC_Product_Variable((int) $productId ), $new_product];
		}

		return [new \WC_Product((int) $productId ), $new_product];
  }

  private function getWoocommerceVariation( $bikeDiscountVariationId, $product, $variationAttributes ) {
		$variationId = $this->getVariationId( $bikeDiscountVariationId, $variationAttributes, $product );
		$variation = new \WC_Product_Variation( $variationId );
		return $variation;
	}

  private function getWoocommerceVariationAttributes( $product ) {
    $formattedAttributes = [];
    $attributes = $product['attributes'];

    foreach ( $attributes as $attribute ) {
      $taxName =  wc_attribute_taxonomy_name( wc_sanitize_taxonomy_name( stripslashes( $attribute['name'] ) ) );

      if ( isset( $this->taxonomies[ $taxName ] ) ) {
        $taxName = $this->taxonomies[ $taxName ];
      }

			$values = $attribute['value'];
      $value = is_array( $values ) ? $values[0] : $values;

			$value = isset( $this->translatedAttributes[ $attribute['name'] ][ $value ] )
				? $this->translatedAttributes[ $attribute['name'] ][ $value ]
				: $value;

      $attrValSlug = wc_sanitize_taxonomy_name( sanitize_title( stripslashes( $value ) ) );
      $formattedAttributes[$taxName] = $attrValSlug;
    }

    return $formattedAttributes;
  }

	// protected function sanitizeDescription( $description ) {
	// 	$descriptionWithReplacedImage = Utils::replaceDescriptionImage( $description );
  //   return Utils::purifyHTML( $descriptionWithReplacedImage );
	// }

  protected function saveProduct( $product, bool $changed, $price, $availability ) {
    do_action( 'lb_multi_inventory_remove_stock_hooks' );

		if ( $changed ) $product->save();

		$this->setMultinventoryData( $product, $price, $availability );

		do_action( 'lb_multi_inventory_add_stock_hooks' );
  }

  // private function setAdditionalData( $product, ProductEntity $productData ) {
  //   $this->setBrand( $product, $productData->getBrand() );
  //   $this->setAttributes( $product, $productData->getAttributes() );

  //   if ( $productData->isVariable() ) {
  //     $variations = $productData->getVariations();
  //     $this->createVariations( $product, $variations );
  //   }
  // }

  // private function setAttributes( $product, array $attributes ) {
	// 	if ( empty( $attributes ) ) {
	// 		return;
	// 	}

  //   $position = 0;
	// 	$productAttributes = [];

	// 	foreach ( $attributes as $attribute ) {
	// 		$attributeName = $attribute->getName();
	// 		$values = $attribute->getValue();
	// 		$isVariation = $attribute->isVariation();
	// 		$values = $this->translateAttributes( $values, $attributeName );

	// 		$name = wc_sanitize_taxonomy_name( stripslashes( $attributeName ) );
	// 		$taxonomy = wc_attribute_taxonomy_name($name); // woocommerce prepend pa_ to each attribute name
	// 		$taxonomy = $this->addTaxonomyIfNotExists( $attributeName, $taxonomy, $values );

	// 		$values = array_map( function ( $value ) {
	// 			if ( is_array( $value ) ) {
	// 				if ( isset( $value['translated_value'] ) && ! empty( $value['translated_value'] ) ) {
	// 					return $value['translated_value'];
	// 				}

	// 				return $value['value'];
	// 			}

	// 			return $value;
	// 		}, $values );

	// 		if ( $values ) {
	// 			wp_set_post_terms( $product->get_id(), $values, $taxonomy, false );
	// 		}

	// 		$productAttributes[ $taxonomy ] = array(
	// 			'name' => $taxonomy,
	// 			'value' => $values,
	// 			'position' => $position++,
	// 			'is_visible' => 1,
	// 			'is_variation' => $isVariation,
	// 			'is_taxonomy' => '1'
	// 		);
	// 	}

	// 	update_post_meta( $product->get_id(), '_product_attributes', $productAttributes );
  // }

	// private function setEnglishData( $product, ProductEntity $productData ) {
	// 	$id = $product->get_id(); 

	// 	if ( empty( $id ) ) {
	// 		return;
	// 	}

	// 	$title = $productData->getTitle();
	// 	$description = $productData->getDescription();

	// 	do_action( 'lb_multi_language_translate_product', $id, 'ingles', $title, $description, '' );
	// }

  // private function setMetaData( $product, ProductEntity $productData ) {
	// 	if ( empty( $product->get_meta( '_lb_gf_gtin' ) ) ) {
	// 		$product->update_meta_data( '_lb_gf_gtin', $productData->getEan() );
	// 	}

  //   return $product;
  // }

	// private function setCustomMetaData( $product, ProductEntity $productData ) {
  //   CrawlerPostMetaData::insert( $product->get_id(), '_bike_discount_product_id_' . $productData->getId(), $productData->getId() );
  //   CrawlerPostMetaData::insert( $product->get_id(), '_bike_discount_url', $productData->getUrl() );
  //   CrawlerPostMetaData::insert( $product->get_id(), '_bike_discount_props', $productData->getParentStoreProps() );
  // }

  private function setMultinventoryData( $product, $price, $stockStatus ) {
		if ( empty( $this->stock ) || $product->is_type( 'variable' ) ) {
			return;
		}

		do_action( 'lb_multi_inventory_set_stock', $product->get_id(), $this->stock, $price, $stockStatus, $product );
	}

  // private function setRequiredData( $product, ProductEntity $productData ) {
	// 	if ( empty( $product->get_name() ) ) {
	// 		$title = $productData->getTitle();
	// 		$translatedTitle = Utils::translate( $title, 'en', 'pt-BR', false, 'post', 'title' );
	// 		$product->set_name( trim( $translatedTitle ) );
	// 	}

	// 	$categories = $this->addCategories( $productData->getCategories() );
	// 	$existentCategories = $product->get_category_ids();
	// 	$product->set_category_ids( array_merge( $categories, $existentCategories ) );

	// 	if ( empty( $product->get_description() ) ) {
	// 		$description = $this->sanitizeDescription( $productData->getDescription() );
	// 		$translatedDescription = Utils::translate( $description, 'en', 'pt-BR', true, 'post', 'description' );			
	// 		$product->set_description( $translatedDescription );
	// 	}

	// 	if ( empty( $product->get_sku() ) ) {
	// 		$product->set_sku( $productData->getSku() );
	// 	}
    
  //   $product = $this->setDimensions( $product, $productData->getDimensions(), $productData->getWeight() );
  //   $product = $this->setImages( $product, $productData->getImages() );
  //   $product = $this->setMetaData( $product, $productData );

  //   $this->setPriceAndStock( $product, $productData->getPrice(), $productData->getAvailability() );

  //   return $product;
  // }

	// private function setSyncData( $product, $new_product ) {
	// 	if ( $new_product ) {
	// 		$sync_to = apply_filters( '_lb_sync_created_product_to', [] );

	// 		if ( ! empty( $sync_to ) ) {
	// 			$product->update_meta_data( '_lb_woo_multistore_reply_to', $sync_to );
	// 			$product->update_meta_data( '_lb_woo_multistore_manage_child_stock', $sync_to );
	// 			$product->update_meta_data( '_lb_woo_multistore_should_enqueue', 'yes' );
	// 		}

	// 		do_action( 'lb_crawler_creating_product', $product, true );
	// 	}
	// }
	
  // private function setBrand( $product, $brand ) {
	// 	$id = $product->get_id();
  //   $brandId = $this->addBrand( $brand );

  //   wp_set_post_terms( $id, $brandId, 'product_brand' );
	// }

	// private function getCrossSelledIds( $meta_key, $product_urls, $like = false ) {
	// 	$meta_query = array(
	// 		'relation' => 'OR',
	// 	);

	// 	foreach ( $product_urls as $product_url ) {
	// 		$meta_query[] = array(
	// 			'key'     => $meta_key,
	// 			'value'   => $like ? '%"' . $product_url . '"%' : $product_url,
	// 			'compare' => 'LIKE',
	// 		);
	// 	}
	
	// 	$query_args = array(
	// 		'post_type'      => 'product',
	// 		'fields'         => 'ids',
	// 		'meta_query'     => $meta_query,
	// 		'posts_per_page' => -1,
	// 	);

	// 	$query = new \WP_Query( $query_args );
		
	// 	return $query->posts;
	// }

	// private function setCrossSelledProducts( $product, $productUrl, $crossSelledProducts ) {
	// 	if ( empty( $crossSelledProducts) ) {
	// 		return;
	// 	}

	// 	$existentCrossSellIds = $product->get_cross_sell_ids();
	// 	$crossSellIds = $this->getCrossSelledIds( '_bike_discount_url', $crossSelledProducts );
	// 	$newCrossSellIds = array_merge( $crossSellIds, $existentCrossSellIds );

	// 	if ( ! empty( $crossSellIds ) ) update_post_meta( $product->get_id(), '_crosssell_ids', array_unique( $newCrossSellIds ) );
		
	// 	CrawlerPostMetaData::insert( $product->get_id(), '_bike_discount_cross_sell_url', $crossSelledProducts );

	// 	foreach ( $crossSellIds as $productId ) {
	// 		$crossSellIds = get_post_meta( $productId, '_crosssell_ids', true );

	// 		if ( empty( $crossSellIds ) ) $crossSellIds = [];

	// 		$crossSellIds[] = $product->get_id();

	// 		update_post_meta( $productId, '_crosssell_ids', array_unique( $crossSellIds ) );
	// 	}
	// }

  // private function setDimensions( $product, array $dimensions, $weight ) {
  //   if ( is_array( $weight ) && empty( $product->get_weight() ) ) {
	// 		$convertedWeight = Utils::convertWeightToWoocommerceUnit( $weight['value'], $weight['unit'] );
	// 		$product->set_weight( $convertedWeight );
  //   }

	// 	$productUnit = isset( $dimensions['unit'] ) ? $dimensions['unit'] : 'cm';

  //   if ( isset( $dimensions['height'] ) && empty( $product->get_height() )) {
	// 		$convertedHeight = Utils::convertDimensionToWoocommerceUnit( $dimensions['height'], $productUnit );
  //     $product->set_height( $convertedHeight );
  //   }

  //   if ( isset( $dimensions['length'] ) && empty( $product->get_length() )) {
	// 		$convertedLength = Utils::convertDimensionToWoocommerceUnit( $dimensions['length'], $productUnit );
  //     $product->set_length( $convertedLength );
  //   }

  //   if ( isset( $dimensions['width'] ) && empty( $product->get_width() )) {
	// 		$convertedWidth = Utils::convertDimensionToWoocommerceUnit( $dimensions['width'], $productUnit );
  //     $product->set_width( $convertedWidth );
  //   }

  //   return $product;
  // }

  // private function setImages( $product, array $images ) {
	// 	if ( empty( $product->get_gallery_image_ids() ) ) {
	// 		$imageIds = $this->addImages( array_unique( $images ) );
	// 		$product->set_image_id( count( $imageIds ) > 0 ? array_shift( $imageIds ) : '');
	// 		$product->set_gallery_image_ids( $imageIds );
	// 	}

  //   return $product;
  // }

  protected function setPriceAndStock( $product, $price, $stockStatus ) {
		if ( empty ( $this->stock ) ) {
			$currentPrice = $product->get_meta( '_main_price' );
      $currentStockAvailability = $product->get_meta( '_main_stock_status' );

			$product->set_regular_price($price);
			$product->set_stock_status( $stockStatus );
			$product->update_meta_data( '_main_price', $price );
			$product->update_meta_data( '_main_stock_status', $stockStatus );

			if ( $currentPrice != $price || $currentStockAvailability != $stockStatus ) {
				return true;
			}
		}

		return false;
	}

	protected function translateAttributes( $values, $attributeName ) {
		if ( empty( $values ) ) {
			return $values;
		}

		return array_map( function( $item ) use ( $attributeName ) {
			$value = is_array( $item ) ? $item['value'] : $value = $item;
			$translatedValue = $value;

			if ( strlen( $value ) > 1 && ! str_ends_with( $value, ' UK' ) && ! str_ends_with( $value, ' EU' ) && ! str_ends_with( $value, ' US' ) ) {
				$translatedValue = Utils::translate( $value, 'en', 'pt-BR', false, 'term', 'title' );
			}

			$this->translatedAttributes[ $attributeName ][ $value ] = $translatedValue;

			if ( is_array( $item ) ) {
				$item['translated_value'] = $translatedValue;
				return $item;
			}

			return [
				'value' => $value,
				'translated_value' => $translatedValue
			];
		}, $values );
	}
}
