<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData as TradeInnSettings;
use LucasBarbosa\LbCrawlersReceiver\Common\Authorization;

class AttributesApi {
  protected $namespace = 'lb-crawlers/v1';
  protected $rest_base = 'attributes';

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

    if ($data['crawlerId'] === 'TT') $this->update_tradeinn( $data['data'] );
  }

  function update_tradeinn( $data ) {
    TradeInnSettings::saveCategoriesAttributes( $data );
  }
}
