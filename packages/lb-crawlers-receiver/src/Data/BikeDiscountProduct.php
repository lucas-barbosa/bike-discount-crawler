<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

use Exception;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\Utils\Utils;

class BikeDiscountProduct extends BikeDiscountHelper {
  public static $IS_RUNNING = false;
  
  function __construct() { 
    parent::loadParams('_lb_bike_discount_stock');
  }

  function handleCreateProduct( $data ) {
    if ( $data['invalid'] === true ) {
			$this->deleteProductIfExists( $data );
			return;
		}

    self::$IS_RUNNING = true;

    $result = $this->getWoocommerceProduct( $data['id'], $data['sku'], is_array( $data['variations'] ) && count( $data['variations'] ) > 0 );

		$wc_product = $result[0];
		$is_new_product = $result[1];

		if ( ! $is_new_product ) {
			return;
		}

    $wc_product = $this->setRequiredData( $wc_product, $data );
		
    parent::saveProduct( $wc_product, true, $data['price'], $data['availability'] );
		$this->setCustomMetaData( $wc_product, $data );
		
		if ( ! $this->checkProductWasAddedManually( $wc_product ) ) {
			$this->setAdditionalData( $wc_product, $data );
			$this->setEnglishData( $wc_product, $data );
			$this->setSyncData( $wc_product, $is_new_product );
		// 	do_action( 'lb_bike_discount_product_created', [ $product->get_id(), $data->getParentStoreProps() ]);
		}

		$this->setCrossSelledProducts( $wc_product, $data['url'], $data['crossSelledProducts'] );

    self::$IS_RUNNING = false;
  }

  private function addBrand( $brandName ) {
		$terms_to_add = [];

		$matchingBrand = get_term_by( 'name', $brandName, 'product_brand' );

    if ( ! empty( $matchingBrand->term_id ) ) {
      $terms_to_add[] = (int) $matchingBrand->term_id;
    } else {
			$id = wp_insert_term( $brandName, 'product_brand' );

      if ( ! is_wp_error( $id ) ) {
        $terms_to_add[] = $id['term_id'];
			}
		}

		return $terms_to_add;
	}

  private function addCategories( $bikeDiscountCategories ) {
		if ( ! is_array( $bikeDiscountCategories ) ) {
			$bikeDiscountCategories = [];
		}
		
    $parentId = get_option( '_lb_bike_discount_parent_category', 0 );
		$categoryIds = array();

    if ( empty( $parentId ) ) {
      $parentId = 0;
    } else {
      $categoryIds[] = $parentId;
    }
    
		foreach ( $bikeDiscountCategories as $categoryName ) {
			$parentName = $parentId !== 0 ? "$parentId-" : '';

			$categoryCacheName = $parentName . $categoryName;
			$categoryExists = BikeDiscountIdMapper::getTermId( $categoryCacheName );
			$parentName .= $categoryName . '_';

      if ( $categoryExists ) {
        $parentId = $categoryExists;
        $categoryIds[] = $parentId;
        continue;
      }

			$translatedCategoryName = Utils::translate( $categoryName, 'en', 'pt-BR', false, 'term', 'title' );

      $terms = get_terms( 'product_cat', array(
        'name' => $translatedCategoryName,
        'parent' => $parentId,
        'hide_empty' => false,
      ) );
				
      if ( ! is_wp_error( $terms ) && count( $terms ) > 0 ) {
        $category = array(
          'term_id' => $terms[0]->term_id,
          'name' 		=> $terms[0]->name,
          'slug' 		=> $terms[0]->slug,
          'parent' 	=> $terms[0]->parent,
        );
      } else {
        $category = wp_insert_term(
          $translatedCategoryName,
          'product_cat',
          array(
            'description' => '',
            'parent' => $parentId
          )
        );
      }

      if ( ! is_wp_error( $category ) && isset( $category['term_id'] ) ) {
				BikeDiscountIdMapper::setTermId( $category['term_id'], $categoryCacheName );

        $parentId = $category['term_id'];
        $categoryIds[] = $parentId;
			}
		}
		
		return array_unique( $categoryIds );
	}

  private function addImages( $imageUrls ) {
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

  private function checkProductWasAddedManually( $product, $productId = '' ) {
		if ( empty($product) ) {
			if (!empty($productId)) {
				return !empty( CrawlerPostMetaData::get( $productId, '_lb_bike_discount_attributes' ) )
					|| !empty( CrawlerPostMetaData::get( $productId, '_lb_bike_discount_url' ) );
			}

			return false;
		}

		return ! empty( CrawlerPostMetaData::get( $product->get_id(), '_lb_bike_discount_attributes') )
			|| ! empty( CrawlerPostMetaData::get( $product->get_id(), '_lb_bike_discount_url') );
	}

  private function createVariations( $product, array $variations ) {
    $existentVariations = $product->get_children( array(
			'fields'      => 'ids',
			'post_status' => array( 'publish', 'private' )
		), ARRAY_A );

		$syncedVariations = [];

		try {
			foreach ( $variations as $i => $variation ) {
				if ( $variation['invalid'] ) {
					continue;
				}

				$syncedVariations[] = $this->createVariation( $i, $product, $variation );
			}
		} catch ( Exception $e ) {
			/**
			 * TO-DO: add log
			 */
		}

		$this->deleteNonUsedVariations( $existentVariations, $syncedVariations );
	}

  private function deleteProductIfExists( $data ) {
		$productId = $this->getProductId($data['id'], $data['sku']);

		if ( $productId ) {
			if ( $this->checkProductWasAddedManually( null, $productId ) ) {
				return;
			}

			wp_delete_post( $productId, true );
		}
	}

  private function getCrossSelledIds( $meta_key, $product_urls, $like = false ) {
		$meta_query = array(
			'relation' => 'OR',
		);

		foreach ( $product_urls as $product_url ) {
			$meta_query[] = array(
				'key'     => $meta_key,
				'value'   => $like ? '%"' . $product_url . '"%' : $product_url,
				'compare' => 'LIKE',
			);
		}
	
		$query_args = array(
			'post_type'      => 'product',
			'fields'         => 'ids',
			'meta_query'     => $meta_query,
			'posts_per_page' => -1,
		);

		$query = new \WP_Query( $query_args );
		
		return $query->posts;
	}

  protected function sanitizeDescription( $description ) {
		$descriptionWithReplacedImage = Utils::replaceDescriptionImage( $description );
    return Utils::purifyHTML( $descriptionWithReplacedImage );
	}

  private function setCustomMetaData( $product, $data ) {
    CrawlerPostMetaData::insert( $product->get_id(), '_bike_discount_product_id_' . $data['id'], $data['id'] );
    CrawlerPostMetaData::insert( $product->get_id(), '_bike_discount_url', $data['url'] );
  }

  private function setAdditionalData( $wc_product, $data ) {
    $this->setBrand( $wc_product, $data['brand'] );
    $this->setAttributes( $wc_product, $data['attributes'] );

    if ( count( $data['variations'] ) > 0 ) {
      $variations = $data['variations'];
      $this->createVariations( $wc_product, $variations );
    }
  }

  private function setAttributes( $product, array $attributes ) {
		if ( empty( $attributes ) ) {
			return;
		}

    $position = 0;
		$productAttributes = [];

		foreach ( $attributes as $attribute ) {
			$attributeName = $attribute['name'];
			$values = $attribute['value'];
			$isVariation = $attribute['variable'];
			$values = $this->translateAttributes( $values, $attributeName );

			$name = wc_sanitize_taxonomy_name( stripslashes( $attributeName ) );
			$taxonomy = wc_attribute_taxonomy_name($name); // woocommerce prepend pa_ to each attribute name
			$taxonomy = $this->addTaxonomyIfNotExists( $attributeName, $taxonomy, $values );

			$values = array_map( function ( $value ) {
				if ( is_array( $value ) ) {
					if ( isset( $value['translated_value'] ) && ! empty( $value['translated_value'] ) ) {
						return $value['translated_value'];
					}

					return $value['value'];
				}

				return $value;
			}, $values );

			if ( $values ) {
				wp_set_post_terms( $product->get_id(), $values, $taxonomy, false );
			}

			$productAttributes[ $taxonomy ] = array(
				'name' => $taxonomy,
				'value' => $values,
				'position' => $position++,
				'is_visible' => 1,
				'is_variation' => $isVariation,
				'is_taxonomy' => '1'
			);
		}

		update_post_meta( $product->get_id(), '_product_attributes', $productAttributes );
  }

  private function setBrand( $product, $brand ) {
		$id = $product->get_id();
    $brandId = $this->addBrand( $brand );

    wp_set_post_terms( $id, $brandId, 'product_brand' );
	}

  private function setCrossSelledProducts( $product, $productUrl, $crossSelledProducts ) {
		if ( empty( $crossSelledProducts) ) {
			return;
		}

		$existentCrossSellIds = $product->get_cross_sell_ids();
		$crossSellIds = $this->getCrossSelledIds( '_bike_discount_url', $crossSelledProducts );
		$newCrossSellIds = array_merge( $crossSellIds, $existentCrossSellIds );

		if ( ! empty( $crossSellIds ) ) update_post_meta( $product->get_id(), '_crosssell_ids', array_unique( $newCrossSellIds ) );
		
		CrawlerPostMetaData::insert( $product->get_id(), '_bike_discount_cross_sell_url', $crossSelledProducts );

		foreach ( $crossSellIds as $productId ) {
			$crossSellIds = get_post_meta( $productId, '_crosssell_ids', true );

			if ( empty( $crossSellIds ) ) $crossSellIds = [];

			$crossSellIds[] = $product->get_id();

			update_post_meta( $productId, '_crosssell_ids', array_unique( $crossSellIds ) );
		}
	}

  private function setDimensions( $product, array $dimensions, $weight ) {
    if ( is_array( $weight ) && empty( $product->get_weight() ) ) {
			$convertedWeight = Utils::convertWeightToWoocommerceUnit( $weight['value'], $weight['unit'] );
			$product->set_weight( $convertedWeight );
    }

		$productUnit = isset( $dimensions['unit'] ) ? $dimensions['unit'] : 'cm';

    if ( isset( $dimensions['height'] ) && empty( $product->get_height() )) {
			$convertedHeight = Utils::convertDimensionToWoocommerceUnit( $dimensions['height'], $productUnit );
      $product->set_height( $convertedHeight );
    }

    if ( isset( $dimensions['length'] ) && empty( $product->get_length() )) {
			$convertedLength = Utils::convertDimensionToWoocommerceUnit( $dimensions['length'], $productUnit );
      $product->set_length( $convertedLength );
    }

    if ( isset( $dimensions['width'] ) && empty( $product->get_width() )) {
			$convertedWidth = Utils::convertDimensionToWoocommerceUnit( $dimensions['width'], $productUnit );
      $product->set_width( $convertedWidth );
    }

    return $product;
  }

  private function setEnglishData( $wc_product, $data ) {
		$id = $wc_product->get_id(); 

		if ( empty( $id ) ) {
			return;
		}

		$title = $data['title'];
		$description = $data['description'];

		do_action( 'lb_multi_language_translate_product', $id, 'ingles', $title, $description, '' );
	}

  private function setImages( $product, array $images ) {
		if ( empty( $product->get_gallery_image_ids() ) ) {
			$imageIds = $this->addImages( array_unique( $images ) );
			$product->set_image_id( count( $imageIds ) > 0 ? array_shift( $imageIds ) : '');
			$product->set_gallery_image_ids( $imageIds );
		}

    return $product;
  }

  private function setMetaData( $wc_product, $data ) {
		if ( empty( $wc_product->get_meta( '_lb_gf_gtin' ) ) ) {
      $ean = '';
      if ( count( $data['variations'] ) > 0 ) {
        $ean = $data['variations'][0]['ean'];
      }
      if ( ! empty( $ean ) ) {
        $wc_product->update_meta_data( '_lb_gf_gtin', $ean );
      }
		}

    return $wc_product;
  }

  private function setRequiredData( $wc_product, $data ) {
		if ( empty( $wc_product->get_name() ) ) {
			$title = $data['title'];
			$translatedTitle = Utils::translate( $title, 'en', 'pt-BR', false, 'post', 'title' );
			$wc_product->set_name( trim( $translatedTitle ) );
		}

		$categories = $this->addCategories( $data['categories'] );
		$existentCategories = $wc_product->get_category_ids();
		$wc_product->set_category_ids( array_merge( $categories, $existentCategories ) );

		if ( empty( $wc_product->get_description() ) ) {
			$description = $this->sanitizeDescription( $data['description'] );
			$translatedDescription = Utils::translate( $description, 'en', 'pt-BR', true, 'post', 'description' );			
			$wc_product->set_description( $translatedDescription );
		}

		if ( empty( $wc_product->get_sku() ) ) {
			$wc_product->set_sku( 'BD-' . $data['sku'] );
		}
    
    $wc_product = $this->setDimensions( $wc_product, $data['dimensions'], $data['weight'] );
    $wc_product = $this->setImages( $wc_product, $data['images'] );
    $wc_product = $this->setMetaData( $wc_product, $data );

    $this->setPriceAndStock( $wc_product, $data['price'], $data['availability'] );

    return $wc_product;
  }

  private function setSyncData( $product, $new_product ) {
		if ( $new_product ) {
			$sync_to = apply_filters( '_lb_sync_created_product_to', [] );

			if ( ! empty( $sync_to ) ) {
				$product->update_meta_data( '_lb_woo_multistore_reply_to', $sync_to );
				$product->update_meta_data( '_lb_woo_multistore_manage_child_stock', $sync_to );
				$product->update_meta_data( '_lb_woo_multistore_should_enqueue', 'yes' );
			}

			do_action( 'lb_crawler_creating_product', $product, true );
      if ( ! empty( $product->get_id() ) ) do_action( 'lb_multistore_new_product_sync_props', $product->get_id() );
		}
	}
}
