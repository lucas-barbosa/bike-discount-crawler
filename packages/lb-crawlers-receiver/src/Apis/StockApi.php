<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Api\BarrabesStock;
use LucasBarbosa\LbCrawlersReceiver\Common\Authorization;
use LucasBarbosa\LbCrawlersReceiver\Data\BikeDiscountStock;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Api\TradeInnStock;
use LucasBarbosa\LbCrawlersReceiver\Utils\CrawlerLogger;

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
      CrawlerLogger::warn( 'stock', 'missing body.data', array() );
      return new \WP_REST_Response( [ 'status' => 'invalid' ], 400 );
    }

    $data = $body['data'];
    CrawlerLogger::debug( 'stock', 'request received', array(
      'crawlerId' => $data['crawlerId'] ?? null,
      'id'        => $data['id'] ?? null,
      'sku'       => $data['sku'] ?? null,
      'url'       => is_array( $data['url'] ?? null ) ? ( $data['url'][0] ?? null ) : ( $data['url'] ?? null ),
      'type'      => isset( $data['variations'] ) && count( $data['variations'] ) > 0 ? 'variable' : 'simple',
      'variations'=> isset( $data['variations'] ) ? count( $data['variations'] ) : 0,
    ) );

    $found = true;
    if ($data['crawlerId'] === 'BD') $found = $this->update_bd_stock( $data );
    else if ($data['crawlerId'] === 'BB') $found = $this->update_bb_stock( $data );
    else if ($data['crawlerId'] === 'TT') $found = $this->update_tt_stock( $data );

    if ( $found === false ) {
      CrawlerLogger::debug( 'stock', 'responding 410 not_found', array( 'crawlerId' => $data['crawlerId'] ?? null, 'id' => $data['id'] ?? null ) );
      return new \WP_REST_Response( [ 'status' => 'not_found' ], 410 );
    }

    CrawlerLogger::debug( 'stock', 'responding 200 ok', array( 'crawlerId' => $data['crawlerId'] ?? null, 'id' => $data['id'] ?? null ) );
    return new \WP_REST_Response( [ 'status' => 'ok' ], 200 );
  }

  function update_bd_stock( $data ) {
    if ( empty( $data['id'] ) && empty( $data['url'] ) ) {
      CrawlerLogger::warn( 'stock.BD', 'skipped: empty id and url', array( 'sku' => $data['sku'] ?? null ) );
      return true;
    }
    $bd = new BikeDiscountStock();
    return $bd->handleUpdateStock( $data );
  }

  function update_bb_stock( $data ) {
    if ( empty( $data['id'] ) && empty( $data['url'] ) ) {
      CrawlerLogger::warn( 'stock.BB', 'skipped: empty id and url', array( 'sku' => $data['sku'] ?? null ) );
      return true;
    }
    $bd = new BarrabesStock();
    return $bd->handleUpdateStock( $data );
  }

  function update_tt_stock( $data ) {
    if ( empty( $data['id'] ) ) {
      CrawlerLogger::warn( 'stock.TT', 'skipped: empty id', array( 'sku' => $data['sku'] ?? null ) );
      return true;
    }
    $bd = new TradeInnStock();
    return $bd->handleUpdateStock( $data );
  }
}
