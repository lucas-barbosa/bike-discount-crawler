<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerOptions;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;

class TradeInnMapper {
  static function getAttachmentId( $key ) {
		$meta = CrawlerPostMetaData::getByMetaKey( '_tradeinn_attachment_' . $key );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return false;
  }

  static function setAttachmentId( $id, $key ) {
    CrawlerPostMetaData::insert( $id, '_tradeinn_attachment_' . $key,  $key );
  }

	static function getAttributeId( $id ) {
    $value = CrawlerOptions::get( 'tradeinn_attribute_' . $id );

		if ( ! empty( $value ) ) {
			return $value;
		}

		return false;
  }

	static function getTermId( $name ) {
    $meta = CrawlerTermMetaData::getByMetaKey( '_tradeinn_term_name_' . $name );

		if ( ! empty( $meta ) && isset( $meta['term_id'] ) ) {
			return $meta['term_id'];
		}

		return false;
  }

	static function getTermByKey( $key ) {
    $meta = CrawlerTermMetaData::getByMetaKey( $key );

		if ( ! empty( $meta ) && isset( $meta['term_id'] ) ) {
			return $meta['term_id'];
		}

		return '';
  }

	static function getTermById( $id ) {
    $meta = CrawlerTermMetaData::getByMetaKey( '_tradeinn_term_id_' . $id );

		if ( ! empty( $meta ) && isset( $meta['term_id'] ) ) {
			return $meta['term_id'];
		}

		return false;
  }

	static function getProductId( $id ) {
		$meta = CrawlerPostMetaData::getByMetaKey( '_tradeinn_product_id_' . $id );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return null;
	}

	static function getVariationId( $id ) {
		$meta = CrawlerPostMetaData::getByMetaKey( '_tradeinn_variation_id_' . $id );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return null;
	}

	static function setVariationId( $post_id, $variation_id ) {
		if ( empty( $variation_id ) ) return;
		CrawlerPostMetaData::insert( $post_id, '_tradeinn_variation_id_' . $variation_id, $variation_id );
	}

	static function setTermId( $term, $id ) {
		CrawlerTermMetaData::insert( $term, '_tradeinn_term_id_' . $id, $id );
	}

	static function setCategoryUrl( $term, $url ) {
		CrawlerTermMetaData::insert( $term, '_category_url', $url );
	}

	static function setTermKey( $term, $key ) {
		CrawlerTermMetaData::insert( $term, $key, $key );
	}

	static function setAttributeId( $tradeinnId, $id ) {
		if ( empty( $tradeinnId ) ) return;
		CrawlerOptions::insert( 'tradeinn_attribute_' . $tradeinnId, $id );
	}
}
