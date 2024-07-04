<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class BikeDiscountOldStock extends BikeDiscountHelper {
  function handleUpdateStock($data) {
    parent::loadParams('_lb_bike_discount_stock');

    foreach ( $data['items'] as $item ) {
      if ( isset( $item['id'] ) && isset( $item['price'] ) && isset( $item['availability'] ) ) {
        do_action( 'lb_multi_inventory_set_stock', $item['id'], $this->stock, $item['price'], $item['availability'] );
      }
    }
  }
}
