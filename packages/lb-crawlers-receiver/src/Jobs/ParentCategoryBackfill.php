<?php

namespace LucasBarbosa\LbCrawlersReceiver\Jobs;


use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\SettingsData as BarrabesSettingsData;
use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Data\SettingsData as BikeDiscountSettingsData;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData as TradeinnSettingsData;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\TradeInnMapper;
use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\BarrabesMapper;
use LucasBarbosa\LbCrawlersReceiver\Data\BikeDiscountIdMapper;

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
      
      if (empty($all_external_categories['all'] )) {
        // "Nenhuma categoria externa encontrada para crawler code {$crawler_code}"
        return;
      }

      $all_selected_categories = self::getSelectedCategoriesByCrawlerCode($crawler_code);
      if (empty($all_selected_categories)) {
        // "Nenhuma categoria selecionada para crawler code {$crawler_code}"
        return;
      }

      // Busca todas folhas com hierarquia da categoria pai externa pelo nome
      $leaves_with_hierarchy = self::findExternalLeafCategories($all_external_categories, $parent_external_cat_name, $crawler_code);
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
        ? self::createWcCategoryFullHierarchy($hierarchy, $wc_parent_term_id, $crawler_code, $leaf_url)
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
     * Estrutura: ['all' => [...], 'sport' => [...], 'pro' => [...]] para BB
     * Estrutura: ['all' => [...]] para outros crawlers
     */
    protected static function getExternalCategoriesByCrawlerCode(string $crawler_code) {
      switch ($crawler_code) {
        case 'BB':
          $sport_categories = BarrabesSettingsData::getCategories( false );
          $pro_categories = BarrabesSettingsData::getCategories( true );
          return [
            'all' => array_merge( $sport_categories, $pro_categories ),
            'sport' => $sport_categories,
            'pro' => $pro_categories,
          ];
        case 'TT':
          return ['all' => TradeinnSettingsData::getCategories()];
        case 'BD':
          return ['all' => BikeDiscountSettingsData::getCategories()];
        default:
          return ['all' => []];
      }
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
    protected static function findExternalLeafCategories(array $categories, string $selected_parent_name, string $crawler_code) {
      // Para Barrabes, precisamos buscar em sport e pro separadamente
      if ($crawler_code === 'BB') {
        // Tenta encontrar na categoria esportiva
        $root = null;
        foreach ($categories['sport'] ?? [] as $cat) {
          if ( self::slugify( $cat['name'] ) === $selected_parent_name) {
            $root = $cat;
            $root_prefix = 'Esportivo';
            break;
          }
        }
        
        // Se não encontrou, tenta na categoria profissional
        if (is_null($root)) {
          foreach ($categories['pro'] ?? [] as $cat) {
            if ( self::slugify( $cat['name'] ) === $selected_parent_name) {
              $root = $cat;
              $root_prefix = 'Profissional';
              break;
            }
          }
        }
      } else {
        // Para outros crawlers, busca normalmente
        $root = null;
        $root_prefix = null;
        foreach ($categories['all'] ?? [] as $cat) {
          if ( self::slugify( $cat['name'] ) === $selected_parent_name) {
            $root = $cat;
            break;
          }
        }
      }

      if (is_null($root)) {
        return [];
      }

      $results = [];

      $traverse = function ($node, $path) use (&$traverse, &$results) {
        $current_path = array_merge($path, [$node['name']]);

        if (empty($node['childs'] ?? [])) {          
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

      // Inicia com o prefixo se existir (para Barrabes)
      $initial_path = isset($root_prefix) ? [$root_prefix] : [];
      $traverse($root, $initial_path);

      return $results;
    }

    /**
     * Cria a hierarquia completa WooCommerce e retorna array com todos os term_ids
     */
    protected static function createWcCategoryFullHierarchy(array $hierarchy, int $wc_parent_term_id, string $crawler_code, string $leaf_url = '') {
      $ancestor_ids = self::getAncestorIds($wc_parent_term_id);
      $term_ids = array_merge($ancestor_ids, []);
      
      $target_parent_id = $wc_parent_term_id;
      $source_parent_id = self::findSourceParentFromHierarchy($hierarchy, $crawler_code);
      $skip_count = $crawler_code === 'BB' ? 2 : 1;

      // Skip root items in hierarchy since they already exist as $wc_parent_term_id
      foreach (array_slice($hierarchy, $skip_count) as $cat_original_name) {
        // Construct the cache key to find the "source" term in the original crawler tree
        $prefix = $source_parent_id !== 0 ? "$source_parent_id-" : '';
        $cache_key = $prefix . $cat_original_name;
        // 1. Try to find the original source term and its current namec
        $name_to_use = $cat_original_name;
        $source_term_id = self::getTermIdFromCache($crawler_code, $cache_key);
        
        if ($source_term_id) {
            $source_term = get_term($source_term_id, 'product_cat');
            if ($source_term && !is_wp_error($source_term)) {
                $name_to_use = $source_term->name;
                $source_parent_id = $source_term_id; // Step deeper into source tree
            }
        } else {
            // If we can't find it in cache, we lose the "source" trail for children
            $source_parent_id = 0; 
        }

        // 2. Find or create the term in the NEW hierarchy using $name_to_use
        $existing_terms = get_terms([
          'taxonomy' => 'product_cat',
          'hide_empty' => false,
          'parent' => $target_parent_id,
          'name' => $name_to_use,
          'fields' => 'all',
        ]);

        $target_term = (is_array($existing_terms) && count($existing_terms)) ? $existing_terms[0] : null;

        if (!$target_term) {
          $new_term = wp_insert_term($name_to_use, 'product_cat', ['parent' => $target_parent_id]);
          if (is_wp_error($new_term)) {
            continue;
          }

          $target_parent_id = $new_term['term_id'];
        } else {
          $target_parent_id = $target_term->term_id;
        }

        $term_ids[] = $target_parent_id;
      }

      // Add metadata to the final leaf category to mark it as a backfilled category
      if (!empty($term_ids) && !empty($leaf_url)) {
        $leaf_term_id = end($term_ids);
        CrawlerTermMetaData::insert($leaf_term_id, '_backfill_source_url', $leaf_url);
      }

      return $term_ids;
    }

    /**
     * Retorna array com todos os ancestor IDs de um term
     */
    protected static function getAncestorIds(int $term_id) {
      $ancestor_ids = [];
      $current_id = $term_id;

      while ($current_id != 0) {
        $term = get_term($current_id, 'product_cat');
        if (!$term || is_wp_error($term)) {
          break;
        }
        array_unshift($ancestor_ids, $term->term_id);
        $current_id = $term->parent;
      }

      return $ancestor_ids;
    }

    /**
     * Encontra o source_parent_id navegando pela hierarquia de categorias raiz
     * Para Barrabes: navega 2 níveis (Esportivo/Profissional + categoria raiz)
     * Para outros: navega 1 nível
     */
    protected static function findSourceParentFromHierarchy(array $hierarchy, string $crawler_code) {
      $source_parent_id = self::getCrawlerBaseParent($crawler_code);
      
      if (empty($hierarchy)) {
        return $source_parent_id;
      }

      if ($crawler_code === 'BB' && count($hierarchy) >= 2) {
        // Primeiro nível: Esportivo ou Profissional
        $source_parent_id = self::findTermIdInHierarchyLevel($hierarchy[0], $source_parent_id, $crawler_code);
        
        // Segundo nível: categoria raiz real
        $source_parent_id = self::findTermIdInHierarchyLevel($hierarchy[1], $source_parent_id, $crawler_code);
      } else {
        // Para outros crawlers, apenas buscar o primeiro nível
        $source_parent_id = self::findTermIdInHierarchyLevel($hierarchy[0], $source_parent_id, $crawler_code);
      }

      return $source_parent_id;
    }

    /**
     * Busca o term_id de uma categoria em um nível específico da hierarquia
     */
    protected static function findTermIdInHierarchyLevel(string $category_name, int $parent_id, string $crawler_code) {
      $prefix = $parent_id !== 0 ? "$parent_id-" : '';
      $cache_key = $prefix . $category_name;
      
      $term_id = self::getTermIdFromCache($crawler_code, $cache_key);
      return $term_id ?: $parent_id;
    }

    protected static function getTermIdFromCache(string $crawler_code, string $cache_key) {
        switch ($crawler_code) {
            case 'TT':
                return TradeInnMapper::getTermId($cache_key);
            case 'BB':
                return BarrabesMapper::getTermId($cache_key);
            case 'BD':
                return BikeDiscountIdMapper::getTermId($cache_key);
            default:
                return false;
        }
    }

    protected static function getCrawlerBaseParent(string $crawler_code) {
        switch ($crawler_code) {
            case 'TT':
                return TradeinnSettingsData::getParentCategory();
            case 'BB':
                return BarrabesSettingsData::getParentCategory();
            case 'BD':
                return BikeDiscountSettingsData::getParentCategory();
            default:
                return 0;
        }
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
