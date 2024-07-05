<?php

namespace LucasBarbosa\LbCrawlersReceiver\Common;

class Authorization {
  static function validate_authorization( $request ) {
		$body = $request->get_json_params();
		if ( ! isset( $body['headers'] ) ) {
			return false;
		}
    
    $headers = $body['headers'];
    if ( ! isset( $headers['authorization_key'] ) ) {
      return false;
    }

    $authorization = $headers['authorization_key'];    
    if ( empty( $authorization ) ) {
      return false;
    }

    if ( ! defined( 'LB_CRAWLERS_APP' ) ) {
      return false;
    }

    $crawlerConfig = unserialize( LB_CRAWLERS_APP );

    if ( ! isset( $crawlerConfig['authentication'] ) ) {
      return false;
    }

    $site_key = $crawlerConfig['authentication'];  
    return strcmp( $authorization, $site_key) === 0;
  }
}
