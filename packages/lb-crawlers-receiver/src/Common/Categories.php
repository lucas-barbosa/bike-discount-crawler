<?php

namespace LucasBarbosa\LbCrawlersReceiver\Common;

class Categories {
  static function get_all_site_categories() {
    $cache_key = 'all_site_categories_hierarchy';

    // tenta pegar do cache
    $categories = get_transient($cache_key);
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
    set_transient($cache_key, $categories, 12 * HOUR_IN_SECONDS);

    return $categories;
  }
}
