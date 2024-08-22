<?php

namespace LucasBarbosa\LbCrawlersReceiver\Utils;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\BarrabesMapper;
use LucasBarbosa\LbCrawlersReceiver\Data\BikeDiscountIdMapper;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\TradeInnMapper;

class Utils {
  static function convertWeightToWoocommerceUnit( $value, $productUnit, $desirableUnit = '' ) {
		if ( $value === 0 ) {
			return 0;
		}
		
		$woocommerceUnit = empty( $desirableUnit ) ? get_option( 'woocommerce_weight_unit' ) : $desirableUnit; 

		if ( $woocommerceUnit === $productUnit ) {
			return $value;
		}

    $conversion_factors = array(
			'kg' => 1000,
			'g' => 1
		);
	
		$from_factor = $conversion_factors[$productUnit] ?? null;
		$to_factor = $conversion_factors[$woocommerceUnit] ?? null;
	
		if (is_null($from_factor) || is_null($to_factor)) {
			return 0;
		}
	
		return round( ($value * $from_factor) / $to_factor, 3 );
	}

	static function convertDimensionToWoocommerceUnit( $value, $productUnit, $desirableUnit = '' ) {
		if ( empty( $value ) ) {
			return 0;
		}

		$woocommerceUnit = empty( $desirableUnit ) ? get_option( 'woocommerce_dimension_unit' ) : $desirableUnit;

		if ( $woocommerceUnit === $productUnit ) {
			return $value;
		}

		$conversion_factors = array(
			'cm' => 1.0,
			'mm' => 0.1,
			'm' => 100.0
		);

		$system_value = $value * $conversion_factors[$productUnit];
  	$output_value = $system_value / $conversion_factors[$woocommerceUnit];

		return $output_value;
	}
  
	static function translate( $content, $from, $to, $html = false, $objectType = '', $field = '' ) {
		if ( function_exists( 'lb_translate_text' ) ) {
			$translated = lb_translate_text( $content, $from, $to, $html, $objectType, $field );
			return empty( $translated ) ? $content : $translated;
		}

		return $content;
	}

  static function replaceDescriptionImage( $html, $crawlerId = 'BD' ) {
		if ( !$html ) {
    	return $html;
		}
		
		$dom = self::getDomObject( $html );
		$images = $dom->getElementsByTagName('img');
		
		foreach ( $images as $image ) {
			$img = $image->getAttribute('src');
			
			if ($img) {
				$key = base64_encode( $img );
				$id = self::uploadAttachment( $img, $key, $crawlerId );

				if ($id) {
					$img = wp_get_attachment_url($id);
				}
			}
			
			if ($img) {
				$image->setAttribute('src', $img);
			}
		}

		$body = $dom->getElementsByTagName('body')->item(0);
		return $dom->saveHTML( $body );
	}

  static function ensureMediaUploadIsLoaded() {
		if ( ! function_exists( 'wp_read_image_metadata' ) ) {
			require_once( ABSPATH  . '/wp-admin/includes/file.php' );
			require_once( ABSPATH  . '/wp-admin/includes/image.php' );
		}

    add_filter( 'mime_types', function($existing_mimes) {
      $existing_mimes['webp'] = 'image/webp';
      return $existing_mimes;
    });

    add_filter('upload_mimes', function($existing_mimes) {
      $existing_mimes['webp'] = 'image/webp';
      return $existing_mimes;
    }, 1, 1 );

    add_filter('woocommerce_rest_allowed_image_mime_types', function($mime_types) {
      $mime_types['webp'] = 'image/webp';
      return $mime_types;
    }, 1, 1);

    add_filter( 'file_is_displayable_image', function($result, $path) {
      if ($result === false) {
        $displayable_image_types = array(IMAGETYPE_WEBP);
        $info = @getimagesize($path);
      
        if (empty($info)) {
          $result = false;
        } elseif (!in_array($info[2], $displayable_image_types)) {
          $result = false;
        } else {
          $result = true;
        }
      }
    
      return $result;
    }, 10, 2 );
	}

  private static function getDomObject( $content ) {
		$dom = new \DOMDocument('1.0', 'UTF-8');
		
    libxml_use_internal_errors( true );
		$dom->loadHTML( mb_convert_encoding( $content, 'HTML-ENTITIES', 'UTF-8' ) );
		libxml_use_internal_errors( false );

		return $dom;
	}

  static function purifyHTML( $html ) {    		
		$html = self::removeElements(
			$html,
			array(
				'//div[contains(attribute::class, "a-expander-header")]',
				'//div[contains(attribute::class, "apm-tablemodule")]',
				'//div[contains(attribute::class, "-comparison-table")]',
				'//div[contains(attribute::class, "-carousel")]',
				'//*[@data-action="a-expander-toggle"]',
				'//a[@href="javascript:void(0)"]',
				'//div[@id="boxCaracteristicas"]',
				'//./table[@align="right"]',
				'//ul[contains(@class, "listaArticulos")]/parent::div/preceding-sibling::div[1]',
				'//ul[contains(@class, "listaArticulos")]/parent::div',
				'//iframe',
				'//script',
				'//style',
				'//form',
				'//object',
				'//embed',
				'//select',
				'//input',
				'//textarea',
				'//button',
				'//noscript',
				'//li[contains(text(), "Garantía") or contains(text(), "Garantia") or contains(text(), "Warranty")]'
			)
		);
		return trim($html);
	}

  private static function removeElements( $html, $selectors) {
		if (!$html) {
			return $html;
		}
		
		$dom = self::getDomObject( $html );
		$xpath = new \DOMXPath($dom);
	
		foreach ($selectors as $selector) {
			
			$nodes = $xpath->query($selector);
			
			foreach ($nodes as $node) {
				$node->parentNode->removeChild($node);
			}
		}
		
		$body = $dom->getElementsByTagName('body')->item(0);
		return $dom->saveHTML( $body );
	}

  private static function set_uploaded_image_as_attachment( $upload, $id = 0 ) {
		if ( is_wp_error( $upload ) ) {
			return $upload;
		}
		
		$info    = wp_check_filetype( $upload['file'] );
		$title   = '';
		$content = '';

		if ( $image_meta = \wp_read_image_metadata( $upload['file'] ) ) {
			if ( trim( $image_meta['title'] ) && ! is_numeric( sanitize_title( $image_meta['title'] ) ) ) {
				$title = wc_clean( $image_meta['title'] );
			}
			if ( trim( $image_meta['caption'] ) ) {
				$content = wc_clean( $image_meta['caption'] );
			}
		}

		$attachment = array(
			'post_mime_type' => $info['type'],
			'guid'           => $upload['url'],
			'post_parent'    => $id,
			'post_title'     => $title,
			'post_content'   => $content,
		);

		$attachment_id = wp_insert_attachment( $attachment, $upload['file'], $id );
    
		if ( ! is_wp_error( $attachment_id ) ) {
			wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $upload['file'] ) );
		}

		return $attachment_id;
	}


  static function uploadAttachment( $url, $key, $crawler = 'BD', $upload_for = 'product_image' ) {
		if ( empty( $url ) ) {
			return 0;
		}
		
		set_time_limit( 300 );
    $id = 0;

    if ( $crawler === 'BB' ) {
      $id = BarrabesMapper::getAttachmentId( $key );
    } else if ( $crawler === 'TT' ) {
      $id = TradeInnMapper::getAttachmentId( $key );
    } else {
		  $id = BikeDiscountIdMapper::getAttachmentId( $key );
    }

		if ( $id ) {
			return $id;
		}

		self::ensureMediaUploadIsLoaded();
		
		$upload = wc_rest_upload_image_from_url( $url );
		do_action( 'woocommerce_api_uploaded_image_from_url', $upload, $url, $upload_for );
		$id = Utils::set_uploaded_image_as_attachment( $upload );

		if ( $id === false || empty( $id ) || is_wp_error( $id ) ) {
			return 0;
		}

    if ( $crawler === 'BB' ) {
      BarrabesMapper::setAttachmentId( $id, $key );
    } else if ( $crawler === 'TT' ) {
      TradeInnMapper::setAttachmentId( $id, $key );
    } else {
		  BikeDiscountIdMapper::setAttachmentId( $id, $key );
    }

		return $id;
  }
}
