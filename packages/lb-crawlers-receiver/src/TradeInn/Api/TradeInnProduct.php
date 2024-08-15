<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Api;

use Exception;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\Utils\Utils;

class TradeInnProduct extends TradeInnHelper {
  function __construct() { 
    parent::loadParams('lb_tradeinn_stock');
  }

  // function handleCreateProduct( $data ) {
  //   if ( $data['invalid'] === true ) {
	// 		$this->deleteProductIfExists( $data );
	// 		return;
	// 	}

  //   // TODO: confirm variation > 1
  //   $result = $this->getWoocommerceProduct( $data['url'], $data['sku'], is_array( $data['variations'] ) && count( $data['variations'] ) > 1 );

	// 	$wc_product = $result[0];
	// 	$is_new_product = $result[1];

	// 	if ( ! $is_new_product ) {
	// 		return;
	// 	}

  //   $is_pro = $this->check_is_pro( $data );
  //   $price = $data['price'];
  //   $availability = $data['availability'];

  //   if ( empty( $availability ) && count( $data['variations'] ) === 1 ) {
  //     // If product has only one variation, consider it as simple
  //     $availability = $data['variations'][0]['availability'];
  //   }

  //   $wc_product = $this->setRequiredData( $wc_product, $data, $is_pro, $price, $availability );
		
  //   parent::saveProduct( $wc_product, true, $price, $availability );
	// 	$this->setCustomMetaData( $wc_product, $data );
	// 	$this->setAdditionalData( $wc_product, $data );
	// 	$this->setSyncData( $wc_product, $is_new_product );
	// 	$this->setCrossSelledProducts( $wc_product, $data['crossSelledProducts'] );
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

  // private function addCategories( $barrabesCategories, $is_pro ) {
	// 	if ( ! is_array( $barrabesCategories ) ) {
	// 		$barrabesCategories = [];
	// 	}
		
  //   array_unshift( $barrabesCategories, $is_pro ? 'Profissional' : 'Esportivo' );
  //   $parentId = get_option( 'lb_barrabes_category', 0 );
	// 	$categoryIds = array();

  //   if ( empty( $parentId ) ) {
  //     $parentId = 0;
  //   } else {
  //     $categoryIds[] = $parentId;
  //   }
    
	// 	foreach ( $barrabesCategories as $i => $categoryName ) {
	// 		$parentName = $parentId !== 0 ? "$parentId-" : '';

	// 		$categoryCacheName = $parentName . $categoryName;
	// 		$categoryExists = BarrabesMapper::getTermId( $categoryCacheName );
	// 		$parentName .= $categoryName . '_';

  //     if ( $categoryExists ) {
  //       $parentId = $categoryExists;
  //       $categoryIds[] = $parentId;
  //       continue;
  //     }

  //     $translatedCategoryName = $categoryName;
  //     if ( $is_pro && $i > 0 ) {
  //       $translatedCategoryName = Utils::translate( $categoryName, 'es', 'pt-BR', false, 'term', 'title' );
  //     }

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
  //       BarrabesMapper::setTermId( $category['term_id'], $categoryCacheName );
  //       $parentId = $category['term_id'];
  //       $categoryIds[] = $parentId;
	// 		}
	// 	}
		
	// 	return array_unique( $categoryIds );
	// }

  protected function addImages( $imageUrls ) {
		static $images = array();
		
		$imageIds = array();
		
		if ( $imageUrls ) {
			foreach ( $imageUrls as $imageUrl ) {
				$key = base64_encode( $imageUrl );

				if ( isset( $images[$key] ) ) {
					$imageIds[] = $images[$key];
				} else {				
					$id = Utils::uploadAttachment( $imageUrl, $key );

					if ( $id ) {
						$images[$key] = $id;
						$imageIds[] = $id;
					}					
				}
			}
		}
				
		return $imageIds;
	}

  // private function createVariations( $product, array $variations ) {
  //   $existentVariations = $product->get_children( array(
	// 		'fields'      => 'ids',
	// 		'post_status' => array( 'publish', 'private' )
	// 	), ARRAY_A );

	// 	$syncedVariations = [];

	// 	try {
	// 		foreach ( $variations as $i => $variation ) {
	// 			if ( $variation['invalid'] ) {
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

  // private function deleteProductIfExists( $data ) {
	// 	$productId = $this->getProductId($data['url'], $data['sku']);

	// 	if ( $productId ) {
	// 		wp_delete_post( $productId, true );
	// 	}
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

  // protected function sanitizeDescription( $description ) {
	// 	$descriptionWithReplacedImage = Utils::replaceDescriptionImage( $description );
  //   return Utils::purifyHTML( $descriptionWithReplacedImage );
	// }

  // private function setCustomMetaData( $product, $data ) {
  //   CrawlerPostMetaData::insert( $product->get_id(), '_lb_barrabes_url', $data['url'] );
  // }

  // private function setAdditionalData( $wc_product, $data ) {
  //   $this->setBrand( $wc_product, $data['brand'] );
  //   $this->setAttributes( $wc_product, $data['attributes'] );

  //   if ( count( $data['variations'] ) > 1 ) {
  //     $variations = $data['variations'];
  //     $this->createVariations( $wc_product, $variations );
  //   }
  // }

  // private function setAttributes( $product, array $attributes ) {
	// 	if ( empty( $attributes ) ) {
	// 		return;
	// 	}

  //   $position = 0;
	// 	$productAttributes = [];

	// 	foreach ( $attributes as $attribute ) {
	// 		$attributeName = $attribute['name'];
	// 		$values = $attribute['value'];
	// 		$isVariation = $attribute['variable'];

	// 		$name = wc_sanitize_taxonomy_name( stripslashes( $attributeName ) );
	// 		$taxonomy = wc_attribute_taxonomy_name($name); // woocommerce prepend pa_ to each attribute name
	// 		$taxonomy = $this->addTaxonomyIfNotExists( $taxonomy, $attributeName, $values );

	// 		$values = array_map( function ( $value ) {
	// 			if ( is_array( $value ) ) {
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

  // private function setBrand( $product, $brand ) {
	// 	$id = $product->get_id();
  //   $brandId = $this->addBrand( $brand );
  //   wp_set_post_terms( $id, $brandId, 'product_brand' );
	// }

  // private function setCrossSelledProducts( $product, $crossSelledProducts ) {
	// 	if ( empty( $crossSelledProducts) ) {
	// 		return;
	// 	}

	// 	$existentCrossSellIds = $product->get_cross_sell_ids();
	// 	$crossSellIds = $this->getCrossSelledIds( '_lb_barrabes_url', $crossSelledProducts );
	// 	$newCrossSellIds = array_merge( $crossSellIds, $existentCrossSellIds );

	// 	if ( ! empty( $crossSellIds ) ) update_post_meta( $product->get_id(), '_crosssell_ids', array_unique( $newCrossSellIds ) );
		
	// 	CrawlerPostMetaData::insert( $product->get_id(), '_barrabes_cross_sell_url', $crossSelledProducts );

	// 	foreach ( $crossSellIds as $productId ) {
	// 		$crossSellIds = get_post_meta( $productId, '_crosssell_ids', true );

	// 		if ( empty( $crossSellIds ) ) $crossSellIds = [];

	// 		$crossSellIds[] = $product->get_id();

	// 		update_post_meta( $productId, '_crosssell_ids', array_unique( $crossSellIds ) );
	// 	}
	// }

  // private function setDimensions( $product, $dimensions, $weight ) {
  //   if ( is_array( $weight ) && empty( $product->get_weight() ) ) {
	// 		$convertedWeight = Utils::convertWeightToWoocommerceUnit( $weight['value'], $weight['unit'] );
	// 		$product->set_weight( $convertedWeight );
  //   }

	// 	if ( ! empty( $dimensions) ) {
	// 		$productUnit = isset( $dimensions['unit'] ) ? $dimensions['unit'] : 'cm';

	// 		if ( isset( $dimensions['height'] ) && empty( $product->get_height() )) {
	// 			$convertedHeight = Utils::convertDimensionToWoocommerceUnit( $dimensions['height'], $productUnit );
	// 			$product->set_height( $convertedHeight );
	// 		}

	// 		if ( isset( $dimensions['length'] ) && empty( $product->get_length() )) {
	// 			$convertedLength = Utils::convertDimensionToWoocommerceUnit( $dimensions['length'], $productUnit );
	// 			$product->set_length( $convertedLength );
	// 		}

	// 		if ( isset( $dimensions['width'] ) && empty( $product->get_width() )) {
	// 			$convertedWidth = Utils::convertDimensionToWoocommerceUnit( $dimensions['width'], $productUnit );
	// 			$product->set_width( $convertedWidth );
	// 		}
	// 	}

  //   return $product;
  // }

  protected function setImages( $product, array $images, $should_save = false ) {
		if ( empty( $product->get_gallery_image_ids() ) ) {
			$imageIds = $this->addImages( array_unique( $images ) );
			$product->set_image_id( count( $imageIds ) > 0 ? array_shift( $imageIds ) : '');
			$product->set_gallery_image_ids( $imageIds );

      if ( $should_save ) {
        $product->save();
      }
		}

    return $product;
  }

  // private function setRequiredData( $wc_product, $data, $is_pro, $price, $availability) {
	// 	if ( empty( $wc_product->get_name() ) ) {
	// 		$title = $data['title'];
	// 		$wc_product->set_name( $title );
	// 	}

	// 	$categories = $this->addCategories( $data['categories'], $is_pro );
	// 	$existentCategories = $wc_product->get_category_ids();
	// 	$wc_product->set_category_ids( array_merge( $categories, $existentCategories ) );

	// 	if ( empty( $wc_product->get_description() ) ) {
	// 		$description = $this->sanitizeDescription( $data['description'] );	
	// 		$wc_product->set_description( $description );
	// 	}

	// 	if ( empty( $wc_product->get_sku() ) ) {
	// 		$wc_product->set_sku( 'BB-' . $data['sku'] );
	// 	}
	
  //   $wc_product = $this->setDimensions( $wc_product, isset( $data['dimensions'] ) ? $data['dimensions'] : [], $data['weight'] );
	// 	$wc_product = $this->setImages( $wc_product, $data['images'] );

  //   $this->setPriceAndStock( $wc_product, $price, $availability );
  //   return $wc_product;
  // }

  // private function setSyncData( $product, $new_product ) {
	// 	if ( $new_product ) {
	// 		do_action( 'lb_crawler_creating_product', $product, true );
  //     if ( ! empty( $product->get_id() ) ) do_action( 'lb_multistore_new_product_sync_props', $product->get_id() );
	// 	}
  // }
}
