<?php

namespace LucasBarbosa\LbCrawlersReceiver\Utils;

class Utils {
	static function translate( $content, $from, $to, $html = false, $objectType = '', $field = '' ) {
		if ( function_exists( 'lb_translate_text' ) ) {
			return lb_translate_text( $content, $from, $to, $html, $objectType, $field );
		}

		return $content;
	}
}
