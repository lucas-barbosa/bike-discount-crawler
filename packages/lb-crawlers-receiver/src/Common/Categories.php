<?php

namespace LucasBarbosa\LbCrawlersReceiver\Common;

class Categories {
  static function get_all_site_categories() {
    $wp_categories = get_terms( array(
        'taxonomy' => 'product_cat',
        'hide_empty' => false,
    ) );
    $categories = array_map(function($cat) {
        return (object) [
            'id' => $cat->term_id,
            'name' => $cat->name
        ];
    }, $wp_categories);
    return $categories;
  }
}
