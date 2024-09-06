<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\Utils\Utils;

class BikeDiscountStock extends BikeDiscountHelper {
  function handleUpdateStock($data) {
    $productId = $this->getProductId($data['id'], $data['sku'], $data['url']);

    if (!$productId) {
      return;
    }

    $product = wc_get_product($productId);

    if (!$product) {
      return;
    }

    if ( ! empty( CrawlerPostMetaData::get( $productId, '_lb_bike_discount_attributes' ) ) ) {
      return;
    }

    parent::loadParams('_lb_bike_discount_stock');

    if ($product->is_type('simple')) {
      $this->syncSimpleProduct( $product, $data );
      return;
    }

    $this->syncVariableProduct( $product, $data );
  }

  private function syncSimpleProduct( $product, $data ) {
    $price = $data['price'];
    $availability = $data['availability'];

    $changed = parent::setPriceAndStock($product, $price, $availability);
    parent::saveProduct($product, $changed, $price, $availability);
  }

  private function syncVariableProduct( $product, $data ) {
    $existentVariations = $product->get_children( array(
    	'fields'      => 'ids',
    	'post_status' => array( 'publish', 'private' )
    ), ARRAY_A );

    $syncedVariations = [];

    foreach ($data['variations'] as $i => $variation) {
      $attributes = $this->getWoocommerceVariationAttributes( $variation );
      $variationId = $this->getVariationId( $variation['id'], $attributes, $product );

      if ( empty( $variationId ) ) {
        $this->appendVariation( $i, $product, $variation );
        continue;
      }

      $syncedVariations[] = $variationId;
      $variationProduct = wc_get_product($variationId);

      if (!$variationProduct) {
        continue;
      }

      $price = $variation['price'];
      $availability = $variation['availability'];

      $changed = parent::setPriceAndStock($variationProduct, $price, $availability);
      parent::saveProduct($variationProduct, $changed, $price, $availability);
    }

    $this->setNotFoundVariationsOutStock( $existentVariations, $syncedVariations );
  }

  private function appendAttribute($product, $attribute_name, $attribute_value) {
    // $attribute = $product->get_attribute( $attribute_name );

    // if ( !$attribute ) {
    //   return;
    // }

    // Translate Attributes to Portuguese
    $values = [$attribute_value];
    $translatedAttribute = $attribute_name === 'Model'
      ? 'Modelo'
      : Utils::translate($attribute_name, 'en', 'pt-BR', false, 'attribute', 'title');
    $values = $this->translateAttributes($values, $translatedAttribute);

    $name = wc_sanitize_taxonomy_name(stripslashes($attribute_name));
    $taxonomy = wc_attribute_taxonomy_name($name);
    $taxonomy = $this->addTaxonomyIfNotExists($attribute_name, $taxonomy, $values);

    wp_set_post_terms($product->get_id(), $attribute_value, $taxonomy, true);
  }

  private function appendVariation($i, $product, $variation) {
    $attributes = $variation['attributes'];

    foreach ( $attributes as $attribute ) {
      $this->appendAttribute($product, $attribute['name'], $attribute['value'][0]);
    }

    $this->createVariation($i, $product, $variation);
  }

  private function setNotFoundVariationsOutStock( $existentVariations, $foundVariations ) {
  	if ( empty( $existentVariations ) ) {
  		return;
  	}

  	foreach ( $existentVariations as $variationId ) {
  		if ( ! in_array( $variationId, $foundVariations ) ) {
  			$product = wc_get_product( $variationId );

        if ( ! $product ) {
          continue;
        }

        $price = '';
        $availability = 'outofstock';

        $changed = parent::setPriceAndStock( $product, $price, $availability );
        parent::saveProduct( $product, $changed, $price, $availability );
  		}
  	}		
  }
}
