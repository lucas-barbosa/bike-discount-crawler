<?php

namespace LucasBarbosa\LbCrawlersReceiver\Jobs;


use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\SettingsData as BarrabesSettingsData;
use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Data\SettingsData as BikeDiscountSettingsData;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData as TradeinnSettingsData;

class ParentCategoryBackfill {

    protected static $batch_size = 20;
    protected static $hook_name = 'lb_crawler_parent_category_backfill';

    /**
     * Dispara o job inicial com categoria pai externa, categoria WooCommerce pai e código do crawler
     */
    public static function dispatch(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code) {
      $args = [$parent_external_cat_name, $wc_parent_term_id, $crawler_code, 0];
      $existing = as_next_scheduled_action(self::$hook_name, $args, 'lb-crawler');

      if (!$existing) {
        as_schedule_single_action(time() + 5, self::$hook_name, $args, 'lb-crawler');
      }
    }

    /**
     * Registra o hook para processar a fila
     */
    public static function register() {
      add_action(self::$hook_name, [__CLASS__, 'handle'], 10, 4);
    }

    /**
     * Processa um lote de produtos associados a categorias filhas da categoria pai externa,
     * criando hierarquia WooCommerce e associando produtos a todas as categorias da hierarquia.
     *
     * @param string $parent_external_cat_name Nome da categoria pai externa
     * @param int    $wc_parent_term_id         ID da categoria pai WooCommerce
     * @param string $crawler_code              Código do crawler ('BB', 'TT', 'BD')
     * @param int    $offset                    Offset para paginação dos produtos
     */
    public static function handle(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code, int $offset = 0) {
        global $wpdb;

        // Obter lista completa de categorias externa pelo código do crawler
        $all_external_categories = self::getExternalCategoriesByCrawlerCode($crawler_code);
        if (empty($all_external_categories)) {
          // "Nenhuma categoria externa encontrada para crawler code {$crawler_code}"
          return;
        }

        // Busca todas folhas com hierarquia da categoria pai externa pelo nome
        $leaves_with_hierarchy = self::findExternalLeafCategories($all_external_categories, $parent_external_cat_name);
        if (empty($leaves_with_hierarchy)) {
          // "Nenhuma categoria filha encontrada para a categoria pai externa {$parent_external_cat_name}"
          return;
        }

        foreach ($leaves_with_hierarchy as $item) {
          $leaf_url = $item['url'];
          $hierarchy = $item['hierarchy'];

          error_log( $leaf_url );
          error_log(print_r($hierarchy, true));
          // // Cria hierarquia de categorias WooCommerce e obtém todos term_ids para associação
          // $term_ids = self::create_wc_category_full_hierarchy($hierarchy, $wc_parent_term_id);

          // // Busca produtos que tem _category_url igual à leaf_url, em lote paginado
          // $product_ids = $wpdb->get_col(
          //   $wpdb->prepare(
          //       "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_category_url' AND meta_value = %s LIMIT %d OFFSET %d",
          //       $leaf_url,
          //       self::$batch_size,
          //       $offset
          //   )
          // );

          // if (empty($product_ids)) {
          //   continue;
          // }

          // // Associa cada produto a todos os termos da hierarquia
          // foreach ($product_ids as $product_id) {
          //   wp_set_object_terms($product_id, $term_ids, 'product_cat', true);
          // }

          // // Se lotou, reagenda para próximo batch
          // if (count($product_ids) === self::$batch_size) {
          //   as_schedule_single_action(
          //     time() + 5,
          //     self::$hook_name,
          //     [$parent_external_cat_name, $wc_parent_term_id, $crawler_code, $offset + self::$batch_size],
          //     'lb-crawler'
          //   );
          //   break; // pausa para próxima execução
          // }
        }
    }

    /**
     * Retorna um array associativo com as categorias externas para o crawler informado
     *
     * Estrutura: [ 'category_url' => ['parent' => parent_url|null, 'name' => nome], ... ]
     */
    protected static function getExternalCategoriesByCrawlerCode(string $crawler_code) {
      switch ($crawler_code) {
        case 'BB':
          $sport_categories = BarrabesSettingsData::getCategories( false );
          $pro_categories = BarrabesSettingsData::getCategories( true );
          $all_external_categories = array_merge( $sport_categories, $pro_categories );
          break;
        case 'TT':
          $all_external_categories = TradeinnSettingsData::getCategories();
          break;
        case 'BD':
          $all_external_categories = BikeDiscountSettingsData::getCategories();
          break;
        default:
          $all_external_categories = [];
          break;
      }

      return $all_external_categories;
    }

    /**
     * Retorna array de folhas com hierarquia completa a partir da categoria pai externa (nome)
     * Cada item: ['url' => string, 'hierarchy' => array de objetos categoria desde raiz até folha]
     */
    protected static function findExternalLeafCategories(array $categories, string $selected_parent_name) {
      // Busca o objeto raiz pelo nome
      $root = null;
      foreach ($categories as $cat) {
        if ($cat['name'] === $selected_parent_name) {
          $root = $cat;
          break;
        }
      }

      if (is_null($root)) {
        return [];
      }

      $results = [];

      $traverse = function ($node, $path) use (&$traverse, &$results) {
        $current_path = array_merge($path, [$node]);

        if (empty($node['childs'] ?? [])) {
          // Nó folha
          $results[] = [
            'url' => $node['url'],
            'hierarchy' => $current_path,
          ];
          return;
        }

        foreach ($node['childs'] as $child) {
          $traverse($child, $current_path);
        }
      };

      // A função precisa de filhos (childs) para o nó, monta-os para todos os nós
      $traverse($root, []);

      return $results;
    }

    /**
     * Cria a hierarquia completa WooCommerce e retorna array com todos os term_ids
     */
    protected static function create_wc_category_full_hierarchy(array $hierarchy, int $wc_parent_term_id) {
        $parent_id = $wc_parent_term_id;
        $term_ids = [];

        foreach ($hierarchy as $cat) {
            $cat_name = $cat['name']; // Usa nome amigável
            $existing_terms = get_terms([
                'taxonomy' => 'product_cat',
                'hide_empty' => false,
                'parent' => $parent_id,
                'name' => $cat_name,
                'fields' => 'all',
            ]);
            $term = (is_array($existing_terms) && count($existing_terms)) ? $existing_terms[0] : null;

            if (!$term) {
                $new_term = wp_insert_term($cat_name, 'product_cat', ['parent' => $parent_id]);
                if (is_wp_error($new_term)) {
                    continue;
                }
                $parent_id = $new_term['term_id'];
            } else {
                $parent_id = $term->term_id;
            }

            $term_ids[] = $parent_id;
        }

        return $term_ids;
    }
}
