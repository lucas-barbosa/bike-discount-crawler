<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class BikeDiscountTranslation extends BikeDiscountHelper {
  public static $IS_RUNNING = false;
  
  function handleTranslateProduct( $data ) {
    $productId = $this->getProductId($data['id'], $data['sku'], $data['url']);

    if ( ! $productId ) {
      return;
    }

    $language = $data['language'];
    if ( $language === 'es' ) $language = 'espanhol';
    do_action( 'lb_multi_language_translate_product', $productId, $language, $data['title'], $data['description'], '' );
  }
}
