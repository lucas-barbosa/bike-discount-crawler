<?php

namespace LucasBarbosa\LbCrawlersReceiver\Common;

abstract class BaseProduct {
  abstract protected function getOverrideCategoryId( $categoryUrl );
  abstract protected function addCategories( $crawlerCategories, $defaultParentId = null, $categoryUrl = '' );
  abstract protected function getParentCategory();

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
		$categoryId = (int) $overrideCategoryId;
		$parentIds = [];
		
		// Get the category term
		$term = get_term( $categoryId, 'product_cat' );

		if ( ! $term || is_wp_error( $term ) ) {
			return null;
		}
		
		// Add the current category ID
		$parentIds[] = $categoryId;
		
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

	/**
	 * Essa função é usada para adicionar as categorias originais da Uai Adventure para o produto
	 */
	protected function addOriginalCategories( $crawlerCategories, $categoryUrl ) {
		$mappedCategories = $this->mapCategory( $categoryUrl );

		if ( is_array( $mappedCategories ) ) {
			return array_unique( $mappedCategories );
		}

		if ( is_null( $mappedCategories ) && is_array( $crawlerCategories ) && count( $crawlerCategories ) > 0 ) {
			$mappedCategories = $this->mapCategory( $crawlerCategories[0] );
		}

		if ( ! is_numeric( $mappedCategories ) ) {
			return [];
		}

		$parentId = $mappedCategories;
		return $this->addCategories( $crawlerCategories, $parentId, $categoryUrl );
	}
}
