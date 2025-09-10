<?php

namespace LucasBarbosa\LbCrawlersReceiver\Jobs;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;

class CategoryBackfill {

  protected static $batch_size = 20;
  protected static $hook_name = 'lb_crawler_category_backfill';
  /**
   * Dispara o job inicial
   */
  public static function dispatch( string $url, int $new_term_id ) {
    $args = [ $url, $new_term_id, 0, null ];
    $existing = as_next_scheduled_action( self::$hook_name, $args, 'lb-crawler' );

    if ( ! $existing ) {
      as_schedule_single_action( time() + 5, self::$hook_name, $args, 'lb-crawler' );
    }
  }

  /**
   * Registra o hook que processa a fila
   */
  public static function register() {
    add_action( CategoryBackfill::$hook_name, [ __CLASS__, 'handle' ], 10, 4 );
  }

  /**
   * Processa um lote de produtos
   *
   * @param string   $url
   * @param int      $new_term_id
   * @param int      $offset
   * @param int|null $term_id
   */
  public static function handle( string $url, int $new_term_id, int $offset = 0, ?int $term_id = null ) {
    global $wpdb;

    // Busca o term_id apenas no primeiro batch
    if ( empty( $term_id ) ) {
      $term_id = CrawlerTermMetaData::getTermIdByMeta('_category_url', $url);

      if ( ! $term_id ) {
        // error_log('No term id found');
        return;
      }
    }

    // Busca lote de produtos vinculados a esse category_id
    $product_ids = $wpdb->get_col( $wpdb->prepare("
        SELECT tr.object_id
        FROM {$wpdb->term_relationships} tr
        INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        WHERE tt.taxonomy = 'product_cat'
          AND tt.term_id = %d
        LIMIT %d OFFSET %d
    ", $term_id, self::$batch_size, $offset ) );

    if ( empty( $product_ids ) ) {
      // "[CategoryBackfill] Nenhum produto restante para term_id: $term_id"
      return;
    }

    $extra_categories = self::getNewCategoryList( $new_term_id );
    if ( empty( $extra_categories ) ) {
      return;
    }

    foreach ( $product_ids as $product_id ) {
      wp_set_object_terms( $product_id, $extra_categories, 'product_cat', true );
    }

    // Se ainda há mais produtos, reagenda o próximo batch
    if ( count( $product_ids ) === self::$batch_size ) {
      $args = [ $url, $new_term_id, $offset + self::$batch_size, $term_id ];
      as_schedule_single_action( time() + 5, self::$hook_name, $args, 'lb-crawler' );
    }
  }

  private static function getNewCategoryList( int $term_id ) {
		$parentIds = [];
		
		// Get the category term
		$term = get_term( $term_id, 'product_cat' );

		if ( ! $term || is_wp_error( $term ) ) {
			return [];
		}
		
		// Add the current category ID
		$parentIds[] = $term_id;
		
		// Get all ancestors (parents) until we reach root (parent = 0)
		$currentParent = $term->parent;
		while ( $currentParent > 0 ) {
			$parentIds[] = $currentParent;
			$parentTerm = get_term( $currentParent, 'product_cat' );
			if ( ! $parentTerm || is_wp_error( $parentTerm ) ) {
				break;
			}
			$currentParent = $parentTerm->parent;
		}
		
		// Return the array of category IDs (from root to leaf)
		return array_reverse( $parentIds );
  }
}
