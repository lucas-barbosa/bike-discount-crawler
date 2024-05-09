<?php

namespace LucasBarbosa\LbCrawlersReceiver\Common;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;

class BDMapper {
  static function getProductId( $id ) {
		$meta = CrawlerPostMetaData::getByMetaKey( '_bike_discount_product_id_' . $id );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return null;
	}

	static function getVariationId( $variationId ) {
		$meta = CrawlerPostMetaData::getByMetaKey( 'variation_id_' . $variationId );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return null;
	}
}