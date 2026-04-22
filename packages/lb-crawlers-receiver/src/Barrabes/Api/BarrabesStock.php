<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Api;

use LucasBarbosa\LbCrawlersReceiver\Utils\CrawlerLogger;

class BarrabesStock extends BarrabesHelper {
  function handleUpdateStock($data) {
    $productId = $this->getProductId($data['url'], $data['sku']);

    CrawlerLogger::debug( 'stock.BB', 'resolved productId', array(
      'sku' => $data['sku'] ?? null,
      'url' => $data['url'] ?? null,
      'productId' => $productId,
    ) );

    if (!$productId) {
      CrawlerLogger::warn( 'stock.BB', 'product not found (will respond 410)', array(
        'sku' => $data['sku'] ?? null, 'url' => $data['url'] ?? null,
      ) );
      return false;
    }

    $product = wc_get_product($productId);

    if (!$product) {
      CrawlerLogger::warn( 'stock.BB', 'wc_get_product returned null', array( 'productId' => $productId ) );
      return false;
    }

    parent::loadParams('lb_barrabes_stock');
    parent::suppress_sync_hooks();

    CrawlerLogger::debug( 'stock.BB', 'syncing', array(
      'productId' => $productId,
      'type' => $product->is_type('simple') ? 'simple' : $product->get_type(),
      'multiInventory' => ! empty( $this->stock ),
    ) );

    if ($product->is_type('simple')) {
      $this->syncSimpleProduct( $product, $data );
    } else {
      $this->syncVariableProduct( $product, $data );
    }

    // After Barrabes changed the site version, we need to update the SKU to match the new version
    $this->update_sku( $product, $data );

    parent::restore_sync_hooks();
    wc_delete_product_transients( $productId );

    CrawlerLogger::debug( 'stock.BB', 'done', array( 'productId' => $productId ) );
    return true;
  }

  private function syncSimpleProduct( $product, $data ) {
    $price = $data['price'];
    $availability = $data['availability'];

    if ( empty( $availability ) && count( $data['variations'] ) === 1 ) {
      // If product has only one variation, consider it as simple
      $availability = $data['variations'][0]['availability'];
    }

    $changed = parent::setPriceAndStock($product, $price, $availability);
    CrawlerLogger::debug( 'stock.BB', 'simple: setPriceAndStock', array(
      'productId' => $product->get_id(), 'price' => $price, 'availability' => $availability, 'changed' => $changed,
    ) );
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
        // Appened only new variations with stock
        if ( $variation['availability'] !== 'outofstock') {
          CrawlerLogger::debug( 'stock.BB', 'variation: not found, appending', array(
            'productId' => $product->get_id(), 'variationSourceId' => $variation['id'] ?? null,
          ) );
          $this->appendVariation( $i, $product, $variation );
        } else {
          CrawlerLogger::debug( 'stock.BB', 'variation: not found, skipped (out-of-stock)', array(
            'productId' => $product->get_id(), 'variationSourceId' => $variation['id'] ?? null,
          ) );
        }
        continue;
      }

      $syncedVariations[] = $variationId;
      $variationProduct = wc_get_product($variationId);

      if (!$variationProduct) {
        CrawlerLogger::warn( 'stock.BB', 'variation: wc_get_product null', array( 'variationId' => $variationId ) );
        continue;
      }

      $price = $variation['price'];
      $availability = $variation['availability'];

      $changed = parent::setPriceAndStock($variationProduct, $price, $availability);
      CrawlerLogger::debug( 'stock.BB', 'variation: setPriceAndStock', array(
        'productId' => $product->get_id(), 'variationId' => $variationId,
        'price' => $price, 'availability' => $availability, 'changed' => $changed,
      ) );
      parent::saveProduct($variationProduct, $changed, $price, $availability);
    }

    $this->setNotFoundVariationsOutStock( $existentVariations, $syncedVariations );
  }

  private function update_sku( $product, $data ) {
    if ( ! empty( $data['sku'] ) ) {
      $barrabes_sku = 'BB-' . $data['sku'];
      $product_sku = $product->get_sku();

      if ( $barrabes_sku !== $product_sku ) {
        $product->set_sku( $barrabes_sku );
        $product->save();
      }
    }
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
