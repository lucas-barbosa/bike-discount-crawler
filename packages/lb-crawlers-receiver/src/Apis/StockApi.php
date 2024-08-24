<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Api\BarrabesStock;
use LucasBarbosa\LbCrawlersReceiver\Common\Authorization;
use LucasBarbosa\LbCrawlersReceiver\Data\BikeDiscountStock;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Api\TradeInnStock;

class StockApi {
  protected $namespace = 'lb-crawlers/v1';
  protected $rest_base = 'stock';

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
    if ($data['crawlerId'] === 'BD') $this->update_bd_stock( $data );
    else if ($data['crawlerId'] === 'BB') $this->update_bb_stock( $data );
    else if ($data['crawlerId'] === 'TT') $this->update_tt_stock( $data );
  }

  function update_bd_stock( $data ) {
    if ( empty( $data['id'] ) ) return;
    $bd = new BikeDiscountStock();
    $bd->handleUpdateStock( $data );
  }

  function update_bb_stock( $data ) {
    if ( empty( $data['id'] ) && empty( $data['url'] ) ) return;
    $bd = new BarrabesStock();
    $bd->handleUpdateStock( $data );
  }

  function update_tt_stock( $data ) {
    if ( empty( $data['id'] ) ) return;
    $bd = new TradeInnStock();
    $bd->handleUpdateStock( $data );
  }
}
