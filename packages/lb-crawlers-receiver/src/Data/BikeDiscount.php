<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;

class BikeDiscount extends CreateProduct {
  function handleUpdateStock( $data ) {
    $productId = self::getProductId( $data['id'], $data['sku'] );

    if ( ! $productId ) {
      return;
    }

    $product = wc_get_product( $productId );

    if ( ! $product ) {
      return;
    }

    parent::loadParams( '_lb_bike_discount_stock' );

    if ( $product->is_type( 'simple' ) ) {
      $price = $data['price'];
      $availability = $data['availability'];

			$changed = parent::setPriceAndStock( $product, $price, $availability );
			parent::saveProduct( $product, $changed, $price, $availability );

      return;
		}

    // $existentVariations = $product->get_children( array(
		// 	'fields'      => 'ids',
		// 	'post_status' => array( 'publish', 'private' )
		// ), ARRAY_A );

		$syncedVariations = [];

    foreach ( $data['variations'] as $i => $variation ) {
      $variationId = self::getVariationId( $variation['id'] );

      if ( empty( $variationId ) ) {
        // $this->appendVariation( $i, $product, $variation ); TODO
        continue;
      }

      $syncedVariations[] = $variationId;
      $variationProduct = wc_get_product( $variationId );

      if ( ! $variationProduct ) {
        continue;
      }

      $price = $variation['price'];
      $availability = $variation['availability'];

			$changed = parent::setPriceAndStock( $variationProduct, $price, $availability );
			parent::saveProduct( $variationProduct, $changed, $price, $availability );
    }

    // $this->setNotFoundVariationsOutStock( $existentVariations, $syncedVariations );
  }

  // private function appendAttribute( $product, $attribute_name, $attribute_value ) {
  //   // $attribute = $product->get_attribute( $attribute_name );

  //   // if ( ! $attribute ) {
  //   //   return;
  //   // }
  //   $values = [ $attribute_value ];
  //   $translatedAttribute = $attribute_name === 'Model' ? 'Modelo' : Utils::translate( $attribute_name, 'en', 'pt-BR', false, 'attribute', 'title' );

  //   $values = $this->translateAttributes( $values, $translatedAttribute );

  //   $name = wc_sanitize_taxonomy_name( stripslashes( $attribute_name ) );
  //   $taxonomy = wc_attribute_taxonomy_name($name);
  //   $taxonomy = $this->addTaxonomyIfNotExists( $attribute_name, $taxonomy, $values );

  //   wp_set_post_terms( $product->get_id(), $attribute_value, $taxonomy, true );
  // }
  
  // private function appendVariation( $i, $product, $variation ) {
  //   $attributes = $variation->getAttributes();

  //   foreach( $attributes as $attribute ) {
  //     $this->appendAttribute( $product, $attribute->getName(), $attribute->getValue()[0] );
  //   }

  //   $this->createVariation( $i, $product, $variation );
  // }

  // private function setNotFoundVariationsOutStock( $existentVariations, $foundVariations ) {
	// 	if ( empty( $existentVariations ) ) {
	// 		return;
	// 	}

	// 	foreach ( $existentVariations as $variationId ) {
	// 		if ( ! in_array( $variationId, $foundVariations ) ) {
	// 			$product = wc_get_product( $variationId );

  //       if ( ! $product ) {
  //         continue;
  //       }

  //       $price = '';
  //       $availability = 'outofstock';

  //       $changed = parent::setPriceAndStock( $product, $price, $availability );
  //       parent::saveProduct( $product, $changed, $price, $availability );
	// 		}
	// 	}		
	// }

  static function getProductId( $id, $sku ) {
		$meta = CrawlerPostMetaData::getByMetaKey( '_bike_discount_product_id_' . $id );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

    $id_by_sku = wc_get_product_id_by_sku( 'BD-' . $sku );

		if ( ! empty( $id_by_sku ) ) {
			return $id_by_sku;
		}

		return null;
	}

  static function getVariationId( $variationId ) {
		$meta = CrawlerPostMetaData::getByMetaKey( 'variation_id_' . $variationId );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return null;
	}
}