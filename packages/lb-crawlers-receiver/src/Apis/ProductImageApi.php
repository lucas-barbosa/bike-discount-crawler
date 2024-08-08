<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Api\BarrabesProductImage;
use LucasBarbosa\LbCrawlersReceiver\Common\Authorization;

class ProductImageApi {
  protected $namespace = 'lb-crawlers/v1';
  protected $rest_base = 'product-image';

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
    if ($data['crawlerId'] === 'BB') $this->update_barrabes_images( $data );
  }

  function update_barrabes_images( $data ) {
    if ( empty( $data['id'] ) && empty( $data['url'] ) ) return;
    $bd = new BarrabesProductImage();
    $bd->handleUpdateImage( $data );
  }
}
