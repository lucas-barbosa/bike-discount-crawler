<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Api;

/**
 * Utilizado para atualizar imagens de produtos sem imagem (08-08-2024)
 */
class TradeInnProductImage extends TradeInnProduct {
  function handleUpdateImage( $data ) {
    $productId = $this->getProductId( $data['id'], $data['sku'] );
		if ( ! $productId ) {
      return;
    }
	
    $product = wc_get_product( $productId );
    if ( ! $product ) {
      return;
    }

    $this->setImages( $product, $data['images'], true );
  }
}
