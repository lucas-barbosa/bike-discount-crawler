<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Api;

/**
 * Utilizado para atualizar imagens de produtos sem imagem (08-08-2024)
 */
class BarrabesProductImage extends BarrabesProduct {
  function handleUpdateImage( $data ) {
    $productId = $this->getProductId( $data['url'], $data['sku'] );
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
