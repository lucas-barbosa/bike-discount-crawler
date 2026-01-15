<?php

namespace LucasBarbosa\LbCrawlersReceiver\Jobs;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;
use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Data\SettingsData;
use LucasBarbosa\LbCrawlersReceiver\Data\BikeDiscountIdMapper;

class BikeDiscountDeleteProductsByCategoryJob {
  public static function register() {
    add_action('lb_bikediscount_delete_products_by_category_async', [__CLASS__, 'dispatch'], 10, 2);
    add_action('lb_bikediscount_delete_products_by_category_job', [__CLASS__, 'handle'], 10, 4);
  }

  public static function dispatch($category, $category_path = []) {
    if (!function_exists('as_schedule_single_action')) {
      return;
    }

    $args = [ $category, $category_path ];
    $existing = as_next_scheduled_action('lb_bikediscount_delete_products_by_category_job', $args, 'lb-crawler');
    if (!$existing) {
      as_schedule_single_action(time() + 5, 'lb_bikediscount_delete_products_by_category_job', $args, 'lb-crawler');
    }
  }

  public static function handle($category, $category_path = [], $batch_size = 20, $term_id = null) {
    global $wpdb;
    if (empty($category)) return;

    if (!$term_id) {
      // Tenta primeiro via hierarquia (category_path)
      if (!empty($category_path) && is_array($category_path)) {
        $term_id = self::findTermIdFromHierarchy($category_path);
      }
      
      // Se não encontrou, tenta via _category_url (meta)
      if (!$term_id) {
        $term_id = CrawlerTermMetaData::getTermIdByMeta('_category_url', $category);
      }
    }
    
    if (!$term_id) return;

    $product_ids = $wpdb->get_col($wpdb->prepare("
      SELECT tr.object_id
      FROM {$wpdb->term_relationships} tr
      INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      WHERE tt.taxonomy = 'product_cat'
        AND tt.term_id = %d
      LIMIT %d
    ", $term_id, $batch_size));

    if (empty($product_ids)) {
      // Se não há mais produtos, deleta a categoria
      self::deleteCategoryIfEmpty($term_id);
      return;
    }

    foreach ($product_ids as $product_id) {
      wp_delete_post($product_id, true);
    }

    // Se ainda há mais produtos, reagenda o próximo batch passando o term_id
    if (count($product_ids) === $batch_size) {
      as_schedule_single_action(time() + 5, 'lb_bikediscount_delete_products_by_category_job', [$category, $category_path, $batch_size, $term_id], 'lb-crawler');
    } else {
      // Último batch - verifica se ainda sobrou algum produto
      self::deleteCategoryIfEmpty($term_id);
    }
  }

  /**
   * Deleta a categoria se não houver mais produtos vinculados
   */
  private static function deleteCategoryIfEmpty($term_id) {
    global $wpdb;
    
    // Verifica se ainda há produtos vinculados
    $count = $wpdb->get_var($wpdb->prepare("
      SELECT COUNT(tr.object_id)
      FROM {$wpdb->term_relationships} tr
      INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      WHERE tt.taxonomy = 'product_cat'
        AND tt.term_id = %d
    ", $term_id));
    
    if ($count == 0) {
      wp_delete_term($term_id, 'product_cat');
    }
  }

  private static function findTermIdFromHierarchy($category_path) {
    if (empty($category_path)) return null;
    
    $source_parent_id = SettingsData::getParentCategory();
    $last_term_id = null;
    
    foreach ($category_path as $cat_name) {
      $prefix = $source_parent_id !== 0 ? "$source_parent_id-" : '';
      $cache_key = $prefix . $cat_name;
      
      $term_id = BikeDiscountIdMapper::getTermId($cache_key);
      
      if ($term_id) {
        $last_term_id = $term_id;
        $source_parent_id = $term_id;
      } else {
        break;
      }
    }
    
    return $last_term_id;
  }
}
