<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Api;

class TradeInnTranslation extends TradeInnHelper {
  public static $IS_RUNNING = false;
  
  function handleTranslateProduct( $data ) {
    $productId = $this->getProductId($data['id'], $data['sku']);

    if ( ! $productId ) {
      return;
    }

    $language = $data['language'];
    if ( $language === 'es' ) $language = 'espanhol';
    else if ( $language === 'en' ) $language = 'ingles';
    do_action( 'lb_multi_language_translate_product', $productId, $language, $data['title'], $data['description'], '' );
  }
}
