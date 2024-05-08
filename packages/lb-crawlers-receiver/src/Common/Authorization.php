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

    $site_key = 'teste';//MultistoreData::getKey();  
    return strcmp( $authorization, $site_key) === 0;
  }
}