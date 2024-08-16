<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\SettingsData as BarrabesSettings;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData as TradeInnSettings;
use LucasBarbosa\LbCrawlersReceiver\Common\Authorization;

class CategoriesApi {
  protected $namespace = 'lb-crawlers/v1';
  protected $rest_base = 'categories';

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

    if ($data['crawlerId'] === 'BD') $this->update_bd( $data['data'] );
    else if ($data['crawlerId'] === 'BB') $this->update_barrabes( $data['data'] );
    else if ($data['crawlerId'] === 'TT') $this->update_tradeinn( $data['data'] );
  }

  function update_barrabes( $data ) {
    if ( isset( $data['barrabes'] ) ) {
      BarrabesSettings::saveCategories( $data['barrabes'], false );
    }

    if ( isset( $data['pro'] ) ) {
      BarrabesSettings::saveCategories( $data['pro'], true );
    }
  }

  function update_bd( $data ) {
    update_option( '_lb_bike_discount_categories', $data, true );
  }

  function update_tradeinn( $data ) {
    TradeInnSettings::saveCategories( $data );
  }
}
