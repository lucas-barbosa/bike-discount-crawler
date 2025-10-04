<?php

namespace LucasBarbosa\LbCrawlersReceiver\Jobs;


use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\SettingsData as BarrabesSettingsData;
use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Data\SettingsData as BikeDiscountSettingsData;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData as TradeinnSettingsData;

class ParentCategoryBackfill {

    protected static $batch_size = 20;
    protected static $hook_name = 'lb_crawler_parent_category_backfill';

    /**
     * Dispara o job inicial com categoria pai externa, categoria WooCommerce pai e código do crawler
     */
    public static function dispatch(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code) {
      $args = [$parent_external_cat_name, $wc_parent_term_id, $crawler_code];
      $existing = as_next_scheduled_action(self::$hook_name, $args, 'lb-crawler');

      if (!$existing) {
        as_schedule_single_action(time() + 5, self::$hook_name, $args, 'lb-crawler');
      }
    }

    /**
     * Registra o hook para processar a fila
     */
    public static function register() {
      add_action(self::$hook_name, [__CLASS__, 'handle'], 10, 3);
      add_action(self::$hook_name . '_leaf', [__CLASS__, 'handleLeafJob'], 10, 7);
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
    public static function handle(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code ) {
      // Obter lista completa de categorias externa pelo código do crawler
      $all_external_categories = self::getExternalCategoriesByCrawlerCode($crawler_code);
      if (empty($all_external_categories)) {
        // "Nenhuma categoria externa encontrada para crawler code {$crawler_code}"
        return;
      }

      $all_selected_categories = self::getSelectedCategoriesByCrawlerCode($crawler_code);
      if (empty($all_selected_categories)) {
        // "Nenhuma categoria selecionada para crawler code {$crawler_code}"
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

        if ( ! in_array( $leaf_url, $all_selected_categories ) ) {
          // Categoria não selecionada para crawler
          continue;
        }

        // Agenda job específico da folha com args posicional
        $args = [$parent_external_cat_name, $wc_parent_term_id, $crawler_code, $leaf_url, $hierarchy, 0, []];
        as_schedule_single_action(time() + 5, self::$hook_name . '_leaf', $args, 'lb-crawler');
      }
    }

    /**
     * Job que processa uma folha/categoria específica
     */
    public static function handleLeafJob(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code, string $leaf_url, array $hierarchy, int $offset = 0, array $cached_terms = []) {
      global $wpdb;

      // Cria hierarquia de categorias WooCommerce e obtém todos term_ids para associação
      $term_ids = empty( $cached_terms )
        ? self::createWcCategoryFullHierarchy($hierarchy, $wc_parent_term_id)
        : $cached_terms;

      if (empty($term_ids)) return;

      // Pega o term_id da categoria no WooCommerce pelo meta
      $term_id = CrawlerTermMetaData::getTermIdByMeta('_category_url', $leaf_url);
      if (!$term_id) return;

      // Busca produtos da categoria com LIMIT + OFFSET
      $product_ids = $wpdb->get_col($wpdb->prepare("
          SELECT tr.object_id
          FROM {$wpdb->term_relationships} tr
          INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
          WHERE tt.taxonomy = 'product_cat'
            AND tt.term_id = %d
          LIMIT %d OFFSET %d
      ", $term_id, self::$batch_size, $offset));

      if (empty($product_ids)) return;

      // Associa produtos à hierarquia
      foreach ($product_ids as $product_id) {
        wp_set_object_terms($product_id, $term_ids, 'product_cat', true);
      }

      // Se ainda há mais produtos, agenda próximo batch mantendo args
      if (count($product_ids) === self::$batch_size) {
        $offset += self::$batch_size;
        $cached_terms = $term_ids; 
        as_schedule_single_action(time() + 5, self::$hook_name . '_leaf', [$parent_external_cat_name, $wc_parent_term_id, $crawler_code, $leaf_url, $hierarchy, $offset, $cached_terms], 'lb-crawler');
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

     protected static function getSelectedCategoriesByCrawlerCode(string $crawler_code) {
      switch ($crawler_code) {
        case 'BB':
          $result = BarrabesSettingsData::getSelectedCategories();
          break;
        case 'TT':
          $result = TradeinnSettingsData::getSelectedCategories();
          break;
        case 'BD':
          $result = BikeDiscountSettingsData::getSelectedCategories();
          break;
        default:
          $result = [];
          break;
      }

      return $result;
    }

    /**
     * Retorna array de folhas com hierarquia completa a partir da categoria pai externa (nome)
     * Cada item: ['url' => string, 'hierarchy' => array de objetos categoria desde raiz até folha]
     */
    protected static function findExternalLeafCategories(array $categories, string $selected_parent_name) {
      // Busca o objeto raiz pelo nome
      $root = null;
      foreach ($categories as $cat) {
        if ( self::slugify( $cat['name'] ) === $selected_parent_name) {
          $root = $cat;
          break;
        }
      }

      if (is_null($root)) {
        return [];
      }

      $results = [];

      $traverse = function ($node, $path, $isRoot = false) use (&$traverse, &$results) {
        // só adiciona o nome se NÃO for o nó raiz
        $current_path = $isRoot ? $path : array_merge($path, [$node['name']]);

        if (empty($node['childs'] ?? [])) {          
          $results[] = [
            'url' => $node['url'],
            'hierarchy' => $current_path,
          ];
          return;
        }

        foreach ($node['childs'] as $child) {
          $traverse($child, $current_path, false);
        }
      };

      // chama com flag indicando que o primeiro é raiz
$traverse($root, [], true);

      return $results;
    }

    /**
     * Cria a hierarquia completa WooCommerce e retorna array com todos os term_ids
     */
    protected static function createWcCategoryFullHierarchy(array $hierarchy, int $wc_parent_term_id) {
      // 1. Add all ancestors of $wc_parent_term_id if it has parents
      $current_id = $wc_parent_term_id;
      $ancestor_ids = [];

      while ($current_id != 0) {
        $term = get_term($current_id, 'product_cat');
        if (!$term || is_wp_error($term)) {
          break;
        }
        // prepend to get top-down order
        array_unshift($ancestor_ids, $term->term_id);
        $current_id = $term->parent;
      }

      $parent_id = $wc_parent_term_id;
      $term_ids = array_merge( $ancestor_ids, []);

      foreach ($hierarchy as $cat) {
        $existing_terms = get_terms([
          'taxonomy' => 'product_cat',
          'hide_empty' => false,
          'parent' => $parent_id,
          'name' => $cat,
          'fields' => 'all',
        ]);

        $term = (is_array($existing_terms) && count($existing_terms)) ? $existing_terms[0] : null;

        if (!$term) {
          $new_term = wp_insert_term($cat, 'product_cat', ['parent' => $parent_id]);
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

  private static function slugify($str) {
    $str = mb_strtolower($str, 'UTF-8'); // minúsculas
    $str = trim($str); // remove espaços extras
    $str = preg_replace('/[^\w\s-]/u', '', $str); // remove caracteres não permitidos
    $str = preg_replace('/[\s_-]+/', '-', $str); // substitui espaço/underscore repetido por "-"
    $str = preg_replace('/^-+|-+$/', '', $str); // remove "-" do início/fim
    return $str;
  }
}
