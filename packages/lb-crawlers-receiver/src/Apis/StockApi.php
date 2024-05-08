<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

use LucasBarbosa\LbCrawlersReceiver\Common\Authorization;

class StockApi {
  protected $namespace = 'lb-crawlers/v1';
  protected $rest_base = 'product-stock';

  function __construct() {
    add_action( 'rest_api_init', array( $this, 'register_routes' ) );
  }

  function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'handle_request' ),
					'permission_callback' => array( Authorization::class, 'validate_authorization' ),
				)
			)
		);
	}

  function handle_request( $request ) {
    var_dump('Arrived here!');
    // $body = $request->get_body_params();

    // if ( ! isset( $body['product_data'] ) ) {
    //   return false;
    // }

    // $product_data = json_decode( $body['product_data'], JSON_OBJECT_AS_ARRAY );

    // if ( is_null( $product_data ) ) {
    //   $product_data = json_decode( stripslashes( $body['product_data'] ), JSON_OBJECT_AS_ARRAY );
    // }

    // if ( isset( $product_data['parent_id'] ) && isset( $product_data['current_stock'] ) ) {
    //   $this->update_stock( $product_data['parent_id'], $product_data['current_stock'], $product_data['store_id']  );
    // }              
      
    // return true;
  }

  function update_stock( $id, $quantity, $store_id ) {
    self::$syncing_store_id = $store_id;
    $product = wc_get_product( $id );

    if ( ! $product ) return;

    update_post_meta( $id, '_stock', $quantity );
    do_action( 'lb_multi_inventory_recalculate_product', $product );
    
    if ( ! did_action( 'woocommerce_update_product' ) && ! did_action( 'woocommerce_update_product_variation' ) ) {
      if ( $product->is_type( 'variation' ) ) {
        do_action( 'woocommerce_update_product_variation', $id );
      } else {
        do_action( 'woocommerce_update_product', $id );
      }
    }
  }
}