<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

class SettingsApi {
  function __construct() {
    add_action( 'lb_crawlers_settings_changed', array( $this, 'sync_changes_to_crawler' ), 10, 3 );
  }

  function sync_changes_to_crawler( $crawlerId, $action, $data ) {
    if ( ! defined( 'LB_CRAWLERS_APP' ) ) {
      return;
    }

    $allowed_actions = [
      'weight_table'          => 'weight-rules',
      'selected_categories'   => 'selected-categories',
      'categories_dimension'  => 'categories-dimension',
      'categories_weight'     => 'categories-weight',
      'override_categories'   => 'override-weight-categories',
      'denied_brands'         => 'denied-brands'
    ];

    $allowed_crawler_id = [
      'BB'  => 'barrabes/settings',
      'BD'  => 'bike-discount/settings',
      'TT'  => 'tradeinn/settings'
    ];

    if ( ! isset( $allowed_actions[ $action ] ) || ! isset( $allowed_crawler_id[ $crawlerId ] ) ) {
      return;
    }

    $crawlerData = unserialize( LB_CRAWLERS_APP );

    if ( ! isset( $crawlerData['host'] ) || ! isset( $crawlerData['api_key'] ) ) {
      return;
    }
    
    $host = $crawlerData['host'];
    $apiKey = $crawlerData['api_key'];
    $crawlerEndpoint = $allowed_crawler_id[ $crawlerId ];
    $actionEndpoint = $allowed_actions[ $action ];
    $url = "{$host}/{$crawlerEndpoint}/{$actionEndpoint}";

    $options = [ 
      'http' => [ 
        'method'  => 'PUT', 
        'header'  => [
          'Content-type: application/json',
          "x-api-key: $apiKey"
        ],
        'content' => json_encode([
          'data' => $data
        ]), 
      ], 
    ]; 
    
    $context  = stream_context_create($options); 
    file_get_contents($url, false, $context);
  }
}
