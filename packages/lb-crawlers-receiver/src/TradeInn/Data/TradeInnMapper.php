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

	static function getVariationId( $id, $store ) {
		$meta = CrawlerPostMetaData::getByMeta( '_tradeinn_variation_id_' . $id, $store );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return null;
	}

	static function setTermId( $term, $id ) {
		CrawlerTermMetaData::insert( $term, '_tradeinn_term_id_' . $id, $id );
	}

	static function setTermKey( $term, $key ) {
		CrawlerTermMetaData::insert( $term, $key, $key );
	}

	static function setAttributeId( $tradeinnId, $id ) {
		if ( empty( $tradeinnId ) ) return;
		CrawlerOptions::insert( 'tradeinn_attribute_' . $tradeinnId, $id );
	}
}
