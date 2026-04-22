<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\Utils\CrawlerLogger;
use LucasBarbosa\LbCrawlersReceiver\Utils\Utils;

class BikeDiscountStock extends BikeDiscountHelper {
  function handleUpdateStock($data) {
    if ( isset( $data[ 'url' ]) && is_array( $data['url'] ) && count( $data['url'] ) > 0) {
      $data['url'] = $data['url'][0];
    }

    $productId = $this->getProductId($data['id'], $data['sku'], $data['url']);

    CrawlerLogger::debug( 'stock.BD', 'resolved productId', array(
      'id' => $data['id'] ?? null,
      'sku' => $data['sku'] ?? null,
      'url' => $data['url'] ?? null,
      'productId' => $productId,
    ) );

    if (!$productId) {
      CrawlerLogger::warn( 'stock.BD', 'product not found (will respond 410)', array(
        'id' => $data['id'] ?? null, 'sku' => $data['sku'] ?? null, 'url' => $data['url'] ?? null,
      ) );
      return false;
    }

    $product = wc_get_product($productId);

    if (!$product) {
      CrawlerLogger::warn( 'stock.BD', 'wc_get_product returned null', array( 'productId' => $productId ) );
      return false;
    }

    if ( ! empty( CrawlerPostMetaData::get( $productId, '_lb_bike_discount_attributes' ) ) ) {
      CrawlerLogger::debug( 'stock.BD', 'skipped: _lb_bike_discount_attributes meta present (manual product)', array( 'productId' => $productId ) );
      return true;
    }

    parent::loadParams('_lb_bike_discount_stock');
    parent::suppress_sync_hooks();

    CrawlerLogger::debug( 'stock.BD', 'syncing', array(
      'productId' => $productId,
      'type' => $product->is_type('simple') ? 'simple' : $product->get_type(),
      'multiInventory' => ! empty( $this->stock ),
    ) );

    if ($product->is_type('simple')) {
      $this->syncSimpleProduct( $product, $data );
    } else {
      $this->syncVariableProduct( $product, $data );
    }

    parent::restore_sync_hooks();
    wc_delete_product_transients( $productId );

    CrawlerLogger::debug( 'stock.BD', 'done', array( 'productId' => $productId ) );
    return true;
  }

  private function syncSimpleProduct( $product, $data ) {
    $price = $data['price'];
    $availability = $data['availability'];

    $changed = parent::setPriceAndStock($product, $price, $availability);
    CrawlerLogger::debug( 'stock.BD', 'simple: setPriceAndStock', array(
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
        CrawlerLogger::debug( 'stock.BD', 'variation: not found, appending', array(
          'productId' => $product->get_id(), 'variationSourceId' => $variation['id'] ?? null,
        ) );
        $this->appendVariation( $i, $product, $variation );
        continue;
      }

      $syncedVariations[] = $variationId;
      $variationProduct = wc_get_product($variationId);

      if (!$variationProduct) {
        CrawlerLogger::warn( 'stock.BD', 'variation: wc_get_product null', array( 'variationId' => $variationId ) );
        continue;
      }

      $price = $variation['price'];
      $availability = $variation['availability'];

      $changed = parent::setPriceAndStock($variationProduct, $price, $availability);
      CrawlerLogger::debug( 'stock.BD', 'variation: setPriceAndStock', array(
        'productId' => $product->get_id(), 'variationId' => $variationId,
        'price' => $price, 'availability' => $availability, 'changed' => $changed,
      ) );
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
