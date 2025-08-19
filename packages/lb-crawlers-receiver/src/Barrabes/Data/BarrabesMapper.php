<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerOptions;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;

class BarrabesMapper {
  static function setAttributeId( $barrabes_id, $id ) {
		if ( empty( $barrabes_id ) ) return;
		CrawlerOptions::insert( 'barrabes_attribute_' . $barrabes_id, $id );
	}

  static function getAttributeId( $id ) {
		$value = CrawlerOptions::get( 'barrabes_attribute_' . $id );

		if ( ! empty( $value ) ) {
			return $value;
		}

		return false;
  }

  static function getProductId( $url ) {
		global $wpdb;

		$initialUrl = explode( '?', $url )[0];
		$meta_like = $wpdb->esc_like( $initialUrl ) . '?%';

		$meta = CrawlerPostMetaData::getByMetaLike( '_lb_barrabes_url', $meta_like, $initialUrl );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return null;
	}

  static function getAttachmentId( $key ) {
    $meta = CrawlerPostMetaData::getByMetaKey( '_barrabes_attachment_' . $key );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return false;
  }

  static function setAttachmentId( $id, $key ) {
    CrawlerPostMetaData::insert( $id, '_barrabes_attachment_' . $key,  $key );
  }

	static function getTermId( $name ) {
    // TODO: sql to migrate data
    $meta = CrawlerTermMetaData::getByMetaKey( '_barrabes_term_name_' . $name );

		if ( ! empty( $meta ) && isset( $meta['term_id'] ) ) {
			return $meta['term_id'];
		}

		return false;
  }

  static function setTermId( $term, $id ) {
    CrawlerTermMetaData::insert( $term, '_barrabes_term_name_' . $id, $id );
	}

	static function setCategoryUrl( $term, $url ) {
		CrawlerTermMetaData::insert( $term, '_category_url', $url );
	}
}
