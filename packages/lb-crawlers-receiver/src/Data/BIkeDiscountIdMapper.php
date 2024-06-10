<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class BikeDiscountIdMapper {
  static function getAttachmentId( $key ) {
		$meta = CrawlerPostMetaData::getByMetaKey( '_bike_discount_attachment_' . $key );

		if ( ! empty( $meta ) && isset( $meta['post_id'] ) ) {
			return $meta['post_id'];
		}

		return false;
  }

	static function getAttributeId( $id ) {
    global $wpdb;

		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT option_value FROM {$wpdb->prefix}options WHERE option_name = %s",
				'bike_discount_attribute_' . $id
			)
		);

		if ( ! empty( $meta->option_value ) ) {
			return $meta->option_value;
		}

		return false;
  }

	static function getTermId( $name ) {
    global $wpdb;

		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}termmeta WHERE meta_key = %s",
				'_bike_discount_term_id_' . $name
			)
		);

		if ( ! empty( $meta->term_id ) ) {
			return $meta->term_id;
		}

		return false;
  }

	static function getTermByKey( $key ) {
    global $wpdb;

		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}termmeta WHERE meta_key = %s",
				$key
			)
		);

		if ( ! empty( $meta->term_id ) ) {
			return $meta->term_id;
		}

		return '';
  }

	static function getTermById( $id ) {
    global $wpdb;

		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}termmeta WHERE meta_key = %s",
				'_bike_discount_term_id_' . $id
			)
		);

		if ( ! empty( $meta->term_id ) ) {
			return $meta->term_id;
		}

		return false;
  }

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

	static function setTermId( $term, $id ) {
		update_term_meta( $term, '_bike_discount_term_id_' . $id, $id );
	}

	static function setTermKey( $term, $key ) {
		update_term_meta( $term, $key, $key );
	}

	static function setAttributeId( $bikeDiscountId, $id ) {
		if ( empty( $bikeDiscountId ) ) return;
		update_option( 'bike_discount_attribute_' . $bikeDiscountId, $id );
	}
}
