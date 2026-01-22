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
    protected static $hook_name_wp = 'lb_crawler_parent_category_backfill_from_wp';

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
     * Dispara o job usando WordPress como fonte (busca folhas do WordPress ao invés de categorias externas)
     */
    public static function dispatchFromWordPress(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code) {
      $args = [$parent_external_cat_name, $wc_parent_term_id, $crawler_code];
      $existing = as_next_scheduled_action(self::$hook_name_wp, $args, 'lb-crawler');

      if (!$existing) {
        as_schedule_single_action(time() + 5, self::$hook_name_wp, $args, 'lb-crawler');
      }
    }

    /**
     * Registra o hook para processar a fila
     */
    public static function register() {
      add_action(self::$hook_name, [__CLASS__, 'handle'], 10, 3);
      add_action(self::$hook_name_wp, [__CLASS__, 'handleFromWordPress'], 10, 3);
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
     * Processa categorias do WordPress (novo comportamento)
     * Busca folhas no WordPress a partir da categoria pai e recria a hierarquia
     *
     * @param string $parent_external_cat_name Nome da categoria pai externa
     * @param int    $wc_parent_term_id         ID da categoria pai WooCommerce
     * @param string $crawler_code              Código do crawler ('BB', 'TT', 'BD')
     */
    public static function handleFromWordPress(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code ) {
      // Find the source parent term ID in WordPress from the external category name
      $source_parent_term_id = self::getSourceParentTermId($parent_external_cat_name, $crawler_code);
      
      if (!$source_parent_term_id) {
        // Parent category not found in WordPress
        return;
      }

      // Get all leaf (deepest) children of this parent in WordPress
      $leaf_categories = self::getWordPressLeafCategories($source_parent_term_id);

      if (empty($leaf_categories)) {
        // No leaf categories found under parent
        return;
      }

      foreach ($leaf_categories as $leaf) {
        $leaf_term_id = $leaf['term_id'];
        $hierarchy = $leaf['hierarchy']; // Array of term names from source parent to leaf

        // Schedule job to recreate this leaf under the new parent
        $args = [$parent_external_cat_name, $wc_parent_term_id, $crawler_code, $leaf_term_id, $hierarchy, 0, []];
        as_schedule_single_action(time() + 5, self::$hook_name . '_leaf', $args, 'lb-crawler');
      }
    }

    /**
     * Job que processa uma folha/categoria específica
     * @param string|int $leaf_url_or_id Can be either a URL string (from handle) or term_id int (from handleFromWordPress)
     */
    public static function handleLeafJob(string $parent_external_cat_name, int $wc_parent_term_id, string $crawler_code, $leaf_url_or_id, array $hierarchy, int $offset = 0, array $cached_terms = []) {
      global $wpdb;

      // Determine if we received URL or term_id
      $is_term_id = is_int($leaf_url_or_id);
      
      // Cria hierarquia de categorias WooCommerce e obtém todos term_ids para associação
      $term_ids = empty( $cached_terms )
        ? self::createWcCategoryFullHierarchy($hierarchy, $wc_parent_term_id, $crawler_code, $leaf_url_or_id)
        : $cached_terms;

      if (empty($term_ids)) return;

      // Get term_id based on what was passed
      if ($is_term_id) {
        $term_id = $leaf_url_or_id;
      } else {
        $term_id = CrawlerTermMetaData::getTermIdByMeta('_category_url', $leaf_url_or_id);
      }
      
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
        as_schedule_single_action(time() + 5, self::$hook_name . '_leaf', [$parent_external_cat_name, $wc_parent_term_id, $crawler_code, $leaf_url_or_id, $hierarchy, $offset, $cached_terms], 'lb-crawler');
      }
    }

    /**
     * Finds the WordPress term ID for the source parent category from external category name
     */
    protected static function getSourceParentTermId(string $parent_external_cat_name, string $crawler_code) {
      $base_parent_id = self::getCrawlerBaseParent($crawler_code);
      
      // Convert slug to actual category name
      $actual_category_name = self::getCategoryNameFromSlug($parent_external_cat_name, $crawler_code);
      if (!$actual_category_name) {
        $actual_category_name = $parent_external_cat_name; // Fallback to slug
      }
      
      if ($crawler_code === 'BB') {
        // For Barrabes, try Esportivo first
        $esportivo_term_id = self::getTermIdFromCache($crawler_code, $base_parent_id . '-Esportivo');

        if ($esportivo_term_id) {
          $term_id = self::getTermIdFromCache($crawler_code, $esportivo_term_id . '-' . $actual_category_name);
          if ($term_id) return $term_id;
        }
        
        // If not found, try Profissional
        $profissional_term_id = self::getTermIdFromCache($crawler_code, $base_parent_id . '-Profissional');

        if ($profissional_term_id) {
          $term_id = self::getTermIdFromCache($crawler_code, $profissional_term_id . '-' . $actual_category_name);
          if ($term_id) return $term_id;
        }
        
        return false;
      } else {
        // For other crawlers, simple lookup
        $prefix = $base_parent_id !== 0 ? "$base_parent_id-" : '';
        $cache_key = $prefix . $actual_category_name;
        return self::getTermIdFromCache($crawler_code, $cache_key);
      }
    }

    /**
     * Converts a slugified category name back to the actual category name
     * by searching through external categories
     */
    protected static function getCategoryNameFromSlug(string $slug, string $crawler_code) {
      $all_categories = self::getExternalCategoriesByCrawlerCode($crawler_code);
      
      $find_in_tree = function($categories, $target_slug) use (&$find_in_tree) {
        foreach ($categories as $cat) {
          if (self::slugify($cat['name']) === $target_slug) {
            return $cat['name'];
          }
          if (!empty($cat['childs'])) {
            $result = $find_in_tree($cat['childs'], $target_slug);
            if ($result) return $result;
          }
        }
        return null;
      };
      
      // Search in all categories
      return $find_in_tree($all_categories['all'] ?? [], $slug);
    }

    /**
     * Gets all leaf (deepest) categories under a parent term with their full hierarchy
     * Returns array of ['term_id' => int, 'hierarchy' => array of names from parent to leaf]
     */
    protected static function getWordPressLeafCategories(int $parent_term_id) {
      $leaves = [];
      
      $traverse = function($term_id, $path) use (&$traverse, &$leaves) {
        $term = get_term($term_id, 'product_cat');
        if (!$term || is_wp_error($term)) {
          return;
        }
        
        $current_path = array_merge($path, [$term->name]);
        
        // Get direct children
        $children = get_terms([
          'taxonomy' => 'product_cat',
          'hide_empty' => false,
          'parent' => $term_id,
          'fields' => 'ids',
        ]);
        
        if (empty($children) || is_wp_error($children)) {
          // This is a leaf category
          $leaves[] = [
            'term_id' => $term_id,
            'hierarchy' => $current_path,
          ];
          return;
        }
        
        // Recursively process children
        foreach ($children as $child_id) {
          $traverse($child_id, $current_path);
        }
      };
      
      // Start traversal from parent's direct children
      $parent_term = get_term($parent_term_id, 'product_cat');
      if (!$parent_term || is_wp_error($parent_term)) {
        return [];
      }
      
      $initial_children = get_terms([
        'taxonomy' => 'product_cat',
        'hide_empty' => false,
        'parent' => $parent_term_id,
        'fields' => 'ids',
      ]);
      
      if (empty($initial_children) || is_wp_error($initial_children)) {
        return [];
      }
      
      foreach ($initial_children as $child_id) {
        $traverse($child_id, []);
      }
      
      return $leaves;
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
    protected static function createWcCategoryFullHierarchy(array $hierarchy, int $wc_parent_term_id, string $crawler_code, $leaf_url_or_id = '') {
      $ancestor_ids = self::getAncestorIds($wc_parent_term_id);
      $term_ids = array_merge($ancestor_ids, []);
      
      $target_parent_id = $wc_parent_term_id;
      $is_term_id = is_int($leaf_url_or_id);
      
      // For term_id based approach (from WordPress), use simple name matching
      if ($is_term_id) {
        foreach ($hierarchy as $cat_name) {
          $existing_terms = get_terms([
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
            'parent' => $target_parent_id,
            'name' => $cat_name,
            'fields' => 'all',
          ]);

          $target_term = (is_array($existing_terms) && count($existing_terms)) ? $existing_terms[0] : null;

          if (!$target_term) {
            $new_term = wp_insert_term($cat_name, 'product_cat', ['parent' => $target_parent_id]);
            if (is_wp_error($new_term)) {
              continue;
            }
            $target_parent_id = $new_term['term_id'];
          } else {
            $target_parent_id = $target_term->term_id;
          }

          $term_ids[] = $target_parent_id;
        }
        
        if (!empty($term_ids) && $leaf_url_or_id > 0) {
          $new_leaf_term_id = end($term_ids);
          CrawlerTermMetaData::insert($new_leaf_term_id, '_backfill_source_term_id', $leaf_url_or_id);
        }
      } else {
        // Original URL-based approach with cache lookups
        $source_parent_id = self::findSourceParentFromHierarchy($hierarchy, $crawler_code);
        $skip_count = $crawler_code === 'BB' ? 2 : 1;

        foreach (array_slice($hierarchy, $skip_count) as $cat_original_name) {
          $prefix = $source_parent_id !== 0 ? "$source_parent_id-" : '';
          $cache_key = $prefix . $cat_original_name;
          $name_to_use = $cat_original_name;
          $source_term_id = self::getTermIdFromCache($crawler_code, $cache_key);
          
          if ($source_term_id) {
              $source_term = get_term($source_term_id, 'product_cat');
              if ($source_term && !is_wp_error($source_term)) {
                  $name_to_use = $source_term->name;
                  $source_parent_id = $source_term_id;
              }
          } else {
              $source_parent_id = 0; 
          }

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
        
        if (!empty($term_ids) && !empty($leaf_url_or_id)) {
          $leaf_term_id = end($term_ids);
          CrawlerTermMetaData::insert($leaf_term_id, '_backfill_source_url', $leaf_url_or_id);
        }
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
