<?php

namespace LucasBarbosa\LbCrawlersReceiver\Common;

class Categories {
  private static $cache_key = 'all_site_categories_hierarchy';

  static function init() {
    // limpa cache quando categorias são criadas ou removidas
    add_action('created_product_cat', [__CLASS__, 'reset_categories_cache']);
    add_action('delete_product_cat', [__CLASS__, 'reset_categories_cache']); 
    add_action('edited_product_cat', [__CLASS__, 'reset_categories_cache']);
  }

  static function reset_categories_cache() {
    delete_transient(self::$cache_key);
  }


  static function get_all_site_categories() {
    // tenta pegar do cache
    $categories = get_transient(self::$cache_key);
    if ($categories !== false) {
      return $categories;
    }

    // caso não tenha no cache, gera normalmente
    $wp_categories = get_terms([
      'taxonomy'   => 'product_cat',
      'hide_empty' => false,
    ]);

    if (is_wp_error($wp_categories)) {
        return [];
    }

    // cria mapa para navegar hierarquia sem consultas extras
    $cat_map = [];
    foreach ($wp_categories as $cat) {
      $cat_map[$cat->term_id] = $cat;
    }

    $get_full_name = function($cat) use (&$cat_map, &$get_full_name) {
      $names = [$cat->name];
      $parent_id = $cat->parent;

      while ($parent_id && isset($cat_map[$parent_id])) {
          array_unshift($names, $cat_map[$parent_id]->name);
          $parent_id = $cat_map[$parent_id]->parent;
      }

      return implode(' / ', $names);
    };

    $categories = array_map(function($cat) use ($get_full_name) {
      return (object) [
        'id'   => $cat->term_id,
        'name' => $get_full_name($cat),
      ];
    }, $wp_categories);

    usort($categories, function($a, $b) {
      return strcasecmp($a->name, $b->name);
    });

    // salva no cache por 12h (pode ajustar o tempo conforme necessidade)
    set_transient(self::$cache_key, $categories, 12 * HOUR_IN_SECONDS);

    return $categories;
  }
}
