<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Api;

class BarrabesStock extends BarrabesHelper {
  function handleUpdateStock($data) {
    $productId = $this->getProductId($data['url'], $data['sku']);

    if (!$productId) {
      return;
    }

    $product = wc_get_product($productId);

    if (!$product) {
      return;
    }

    parent::loadParams('lb_barrabes_stock');

    if ($product->is_type('simple')) {
      $this->syncSimpleProduct( $product, $data );
      return;
    }

    $this->syncVariableProduct( $product, $data );
  }

  private function syncSimpleProduct( $product, $data ) {
    $price = $data['price'];
    $availability = $data['availability'];

    if ( empty( $availability ) && count( $data['variations'] ) === 1 ) {
      // If product has only one variation, consider it as simple
      $availability = $data['variations'][0]['availability'];
    }

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
      $variationId = $this->getVariationId( $variation['id'], $variation['attributes'], $product );

      if ( empty( $variationId ) ) {
        // Appened only new variations with stock
        if ( $variation['availability'] !== 'outofstock') {
          $this->appendVariation( $i, $product, $variation );
        }
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
    $taxonomy_name= wc_attribute_taxonomy_name( wc_sanitize_taxonomy_name( stripslashes( $attribute_name ) ) );
    $taxonomy = $this->addTaxonomyIfNotExists( $taxonomy_name, $attribute_name, [$attribute_value] );
    $attribute = $product->get_attribute( $taxonomy );

    if ( !$attribute ) {
      return false;
    }

    wp_set_post_terms( $product->get_id(), $attribute_value, $taxonomy, true );
    return true;
  }

  private function appendVariation($i, $product, $variation) {
    $attributes = $variation['attributes'];

    foreach ( $attributes as $attribute ) {
      $appended = $this->appendAttribute($product, $attribute['name'], $attribute['value'][0]);
      if ( ! $appended ) return;
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
