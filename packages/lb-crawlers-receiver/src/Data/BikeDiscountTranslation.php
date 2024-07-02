<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class BikeDiscountTranslation extends BikeDiscountHelper {
  public static $IS_RUNNING = false;
  
  function handleTranslateProduct( $data ) {
    $productId = $this->getProductId($data['id'], $data['sku']);

    if ( ! $productId ) {
      return;
    }

    do_action( 'lb_multi_language_translate_product', $productId, $data['language'], $data['title'], $data['description'], '' );
  }
}
