<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Api;

class BarrabesStock extends BarrabesHelper {
  function handleUpdateStock($data) {
    $productId = $this->getProductId($data['id'], $data['sku']);

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
    $price = $this->calculatePrice( $data['price'] );
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
      $variationId = $this->getVariationId( $variation['id'], $variation['attributes'], $product );

      if ( empty( $variationId ) ) {
        $this->appendVariation( $i, $product, $variation );
        continue;
      }

      $syncedVariations[] = $variationId;
      $variationProduct = wc_get_product($variationId);

      if (!$variationProduct) {
        continue;
      }

      $price = $this->calculatePrice( $variation['price'] );
      $availability = $variation['availability'];

      $changed = parent::setPriceAndStock($variationProduct, $price, $availability);
      parent::saveProduct($variationProduct, $changed, $price, $availability);
    }

    $this->setNotFoundVariationsOutStock( $existentVariations, $syncedVariations );
  }

  private function appendAttribute($product, $attribute_name, $attribute_value) {
    $attribute = $product->get_attribute( $attribute_name );

    if ( !$attribute ) {
      return;
    }

    $taxonomy = wc_attribute_taxonomy_name( wc_sanitize_taxonomy_name( stripslashes( $attribute_name ) ) );
    $taxonomy = $this->addTaxonomyIfNotExists( $taxonomy, $attribute_name, [$attribute_value] );
    wp_set_post_terms( $product->get_id(), $attribute_value, $taxonomy, true );
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
