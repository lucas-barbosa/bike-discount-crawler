<?php

namespace LucasBarbosa\LbCrawlersReceiver\CrawlerBlock;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;

class CrawlerBlockActions {
  public function __construct() {
    add_action( 'lb_crawler_block_execute', array( $this, 'block_products' ) );
    add_action( 'lb_crawler_block_single_execute', array( $this, 'block_product_by_id' ) );
    add_action( 'lb_crawler_block_url', array( $this, 'block_product_by_url' ) );
    add_filter( 'lb_crawler_check_block', array( $this, 'check_url_is_blocked' ), 10, 2 );
    if ( is_admin() ) {
      add_action( 'lb_crawler_block_and_delete_execute', array( $this, 'delete_products' ) );
    }
  }

  public function block_products( $product_ids ) {
    foreach ( $product_ids as $product_id ) {
      $this->block_product_by_id( $product_id );
    }
  }

  public function delete_products( $product_ids ) {
    foreach ( $product_ids as $product_id ) {
      $this->block_product_by_id( $product_id );
      wp_delete_post( $product_id );
    }
  }

  public function block_product_by_id( $product_id ) {
    $url = $this->get_product_url( $product_id );
    if ( ! empty( $url ) ) $this->block_product_by_url( $url );
  }

  public function check_url_is_blocked( $is_blocked, $url ) {
    $exists = CrawlerBlockStorage::get( $url );

    if ( ! is_null( $exists ) && ! empty( $exists ) ) {
      return true;
    }

    return $is_blocked;
  }

  public function block_product_by_url( $url ) {
    CrawlerBlockStorage::insert( $url );
  }

  private function get_product_url( $product_id ) {
    $tradeinn_url = CrawlerPostMetaData::get( $product_id, '_lb_tradeinn_url' );

    if ( ! empty( $tradeinn_url ) ) return $tradeinn_url;

    $barrabes_url = CrawlerPostMetaData::get( $product_id, '_lb_barrabes_url' );

    if ( ! empty( $barrabes_url ) ) return $barrabes_url;

    $bike_discount_url = CrawlerPostMetaData::get( $product_id, '_bike_discount_url' );

    if ( ! empty( $bike_discount_url ) ) return $bike_discount_url;

    return '';
  }
}
