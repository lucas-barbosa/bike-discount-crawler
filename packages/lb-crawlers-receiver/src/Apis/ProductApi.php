<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Api\BarrabesProduct;
use LucasBarbosa\LbCrawlersReceiver\Common\Authorization;
use LucasBarbosa\LbCrawlersReceiver\Data\BikeDiscountProduct;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Api\TradeInnProduct;

class ProductApi {
  protected $namespace = 'lb-crawlers/v1';
  protected $rest_base = 'product';

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
    $body = $request->get_json_params();

    if ( ! isset( $body['data'] ) ) {
      return false;
    }

    $data = $body['data'];
    if ($data['crawlerId'] === 'BB') $this->create_barrabes_product( $data );
    else if ($data['crawlerId'] === 'BD') $this->create_bike_discount_product( $data );
    else if ($data['crawlerId'] === 'TT') $this->create_tradeinn_product( $data );
  }

  function create_barrabes_product( $data ) {
    if ( empty( $data['id'] ) ) return;
    $bd = new BarrabesProduct();
    $bd->handleCreateProduct( $data );
  }

  function create_bike_discount_product( $data ) {
    if ( empty( $data['id'] ) ) return;
    $bd = new BikeDiscountProduct();
    $bd->handleCreateProduct( $data );
  }

  function create_tradeinn_product( $data ) {
    if ( empty( $data['id'] ) ) return;
    $bd = new TradeInnProduct();
    $bd->handleCreateProduct( $data );
  }
}
