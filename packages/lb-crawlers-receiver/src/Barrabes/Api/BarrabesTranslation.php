<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Api;

class BarrabesTranslation extends BarrabesHelper {
  public static $IS_RUNNING = false;
  
  function handleTranslateProduct( $data ) {
    $productId = $this->getProductId($data['url'], $data['sku']);

    if ( ! $productId ) {
      return;
    }

    $language = $data['language'];
    if ( $language === 'es' ) $language = 'espanhol';
    else if ( $language === 'en' ) $language = 'ingles';
    do_action( 'lb_multi_language_translate_product', $productId, $language, $data['title'], $data['description'], '' );
  }
}
