<?php

namespace LucasBarbosa\LbCrawlersReceiver\Common;

use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;

abstract class BaseProduct {
  abstract protected function getOverrideCategoryId( $categoryUrl );
  abstract protected function addCategories( $crawlerCategories, $defaultParentId = null, $categoryUrl = '' );
  abstract protected function getParentCategory();
  abstract protected function getCrawlerCode();
  abstract protected function getTermIdFromCache( $cache_key );
  
  protected static function slugify($str) {
    $str = mb_strtolower($str, 'UTF-8'); // minúsculas
    $str = trim($str); // remove espaços extras
    $str = preg_replace('/[^\w\s-]/u', '', $str); // remove caracteres não permitidos
    $str = preg_replace('/[\s_-]+/', '-', $str); // substitui espaço/underscore repetido por "-"
    $str = preg_replace('/^-+|-+$/', '', $str); // remove "-" do início/fim
    return $str;
  }

  /**
   * Prepends any crawler-specific prefix to categories (e.g., Esportivo/Profissional for Barrabes)
   * Default implementation returns categories as-is
   */
  protected function prependCategoryPrefix( $crawlerCategories ) {
    return $crawlerCategories;
  }

  protected function getCategorySkipCount() {
    return 1; // Default to skipping the first category
  }

  protected function mapCategory( $categoryUrl ) {	
    $overrideCategoryId = $this->getOverrideCategoryId( $categoryUrl );
		
		// If override ID is not found, just return null
		if ( ! $overrideCategoryId ) {
			return null;
		}
	
		// Check if it ends with |root
		if ( strpos( $overrideCategoryId, '|root' ) !== false ) {
			// Remove |root suffix and return the parent ID
			return str_replace( '|root', '', $overrideCategoryId );
		}

		// If not root, get all parent IDs of this category (until parent = 0)
		return $this->getCategoryHierarchy( (int) $overrideCategoryId );
	}

	/**
	 * Processa as categorias do crawler, buscando os nomes atualizados do cache/mapper
	 * Similar ao que é feito em ParentCategoryBackfill::createWcCategoryFullHierarchy
	 */
	protected function processcrawlerCategories( $crawlerCategories ) {
		if ( empty( $crawlerCategories ) ) {
			return [];
		}

		$processed_categories = [];
		$source_parent_id = $this->getParentCategory();
		$crawler_code = $this->getCrawlerCode();

		foreach ( $crawlerCategories as $cat_original_name ) {
			// Construct the cache key to find the "source" term in the original crawler tree
			$prefix = $source_parent_id !== 0 ? "$source_parent_id-" : '';
			$cache_key = $prefix . $cat_original_name;
			

			
			// Try to find the original source term and its current name
			$name_to_use = $cat_original_name;
			$source_term_id = $this->getTermIdFromCache( $cache_key );
			
			if ( $source_term_id ) {
				$source_term = get_term( $source_term_id, 'product_cat' );
				if ( $source_term && ! is_wp_error( $source_term ) ) {
					$name_to_use = $source_term->name;
					$source_parent_id = $source_term_id; // Step deeper into source tree
				} else {
					$source_parent_id = 0;
				}
			} else {
				// If we can't find it in cache, we lose the "source" trail for children

				$source_parent_id = 0;
			}
			
			$processed_categories[] = $name_to_use;
		}


		return $processed_categories;
	}

	/**
	 * Retorna array com hierarquia completa de uma categoria (root to leaf)
	 */
	protected function getCategoryHierarchy( $categoryId ) {
		$parentIds = [];
		$term = get_term( $categoryId, 'product_cat' );

		if ( ! $term || is_wp_error( $term ) ) {
			return null;
		}
		
		$parentIds[] = $categoryId;
		
		// Get all ancestors until root
		$currentParent = $term->parent;
		while ( $currentParent > 0 ) {
			$parentIds[] = $currentParent;
			$parentTerm = get_term( $currentParent, 'product_cat' );
			if ( ! $parentTerm || is_wp_error( $parentTerm ) ) {
				break;
			}
			$currentParent = $parentTerm->parent;
		}
		
		return array_reverse( $parentIds );
	}

	/**
	 * Essa função é usada para adicionar as categorias originais da Uai Adventure para o produto
	 */
	protected function addOriginalCategories( $crawlerCategories, $categoryUrl ) {
		// 1. Tenta mapear via override
		$mappedCategories = $this->mapCategory( $categoryUrl );
		if ( is_array( $mappedCategories ) ) {
			return array_unique( $mappedCategories );
		}

		// 2. Verifica se existe categoria backfilled
		$backfilled_category_id = CrawlerTermMetaData::getTermIdByMeta( '_backfill_source_url', $categoryUrl );
		if ( $backfilled_category_id ) {
			$hierarchy = $this->getCategoryHierarchy( $backfilled_category_id );
			if ( is_array( $hierarchy ) ) {
				return $hierarchy;
			}
		}

		// 3. Se não encontrou, tenta pelo primeiro crawler category (root)
		if ( is_null( $mappedCategories ) && is_array( $crawlerCategories ) && count( $crawlerCategories ) > 0 ) {
			$mappedCategories = $this->mapCategory( $crawlerCategories[0] );
		}

		// 4. Se ainda não tem ID numérico, retorna vazio
		if ( ! is_numeric( $mappedCategories ) ) {
			return [];
		}

    // 5. Prepend crawler-specific prefix (e.g., Esportivo/Profissional for Barrabes)
		$categoriesWithPrefix = $this->prependCategoryPrefix( $crawlerCategories );

		// 6. Processa todas as categorias para buscar nomes atualizados (precisamos da hierarquia completa)
		$processed_categories = $this->processcrawlerCategories( $categoriesWithPrefix );

		// 7. Remove a primeira categoria já que ela corresponde ao $mappedCategories
    $skip_count = $this->getCategorySkipCount();
    $categories_to_add = count($processed_categories) > $skip_count ? array_slice($processed_categories, $skip_count) : $processed_categories;

		// 8. Usa o parent ID para criar hierarquia restante com os nomes processados
		return $this->addCategories(
			$categories_to_add,
			$mappedCategories,
			$categoryUrl
		);
	}
}
