<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Api;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\BarrabesMapper;
use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\SettingsData;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerOptions;

class BarrabesHelper {
  private array $taxonomies = [];
  protected string $stock = '';
  
	protected function loadParams( $stockName ) {
		$this->stock = get_option( $stockName, '' );
	}

  protected function addTaxonomyIfNotExists( $taxonomySlug, $taxonomyLabel, $values = array() ) {
    // If taxonomy was created before, reuse it
    if ( isset( $this->taxonomies[ $taxonomySlug ] ) ) {
      return $this->taxonomies[ $taxonomySlug ];
    }

		$attribute_id = $this->getAttributeTaxonomyId( $taxonomyLabel, $taxonomySlug );

		if ( ! is_wp_error( $attribute_id ) && $values ) {
			$taxonomy = wc_attribute_taxonomy_name_by_id( (int) $attribute_id );

			foreach ( $values as $value ) {
				$item_id = $taxonomyLabel . ':' . $value;

				if ( ! empty( $item_id ) && BarrabesMapper::getTermId( $item_id ) ) {
          continue;
        }

        $term = term_exists( $value, $taxonomy );

				if ( ! $term ) {
					$term = wp_insert_term( $value, $taxonomy );
				}

        if ( ! is_wp_error( $term ) && isset( $term['term_id'] ) && ! empty( $item_id ) ) {
          BarrabesMapper::setTermId( $term['term_id'], $item_id );
        }
      }

      $this->taxonomies[ $taxonomySlug ] = $taxonomy;
		}

		return $taxonomy;
	}

	public function createVariation( $i, $wc_product, $variation ) {
		$attributes = $this->getWoocommerceVariationAttributes( $variation );

		$wc_variation = $this->getWoocommerceVariation( $variation['id'], $wc_product, $attributes );
		$wc_variation->set_parent_id( $wc_product->get_id() );

		$variationSku = empty( $variation['id'] )
			? $wc_product->get_sku() . '-' . (string)$i . time()
			: 'BB-' . $variation['id'];

		$wc_variation->set_sku( $variationSku );
		$wc_variation->set_attributes( $attributes );

		$price = $variation['price'];
    $stock = $variation['availability'];

		$this->setPriceAndStock( $wc_variation, $price, $stock );
		$this->saveProduct( $wc_variation, true, $price, $stock );

		return $wc_variation->get_id();
	}

  protected function check_is_pro( $data ) {
    return is_array( $data['metadata'] ) && isset( $data['metadata']['isPro'] ) && !!$data['metadata']['isPro'];
  }

  protected function deleteNonUsedVariations( $existentVariations, $newVariations ) {
		if ( ! empty( $existentVariations ) ) {
			foreach ( $existentVariations as $variationId ) {
				if ( ! in_array( $variationId, $newVariations ) ) {
					wp_delete_post( $variationId, true );
				}
			}
		}
	}

  private function getAttributeTaxonomyId( $taxonomyLabel, $taxonomySlug ) {
		$attributeIdFromCustomTable = BarrabesMapper::getAttributeId( $taxonomyLabel );
		if ( ! empty( $attributeIdFromCustomTable ) ) {
			return $attributeIdFromCustomTable;
		}

    $optionName = 'sp_barrabes_attribute_' . $taxonomyLabel;
		$attributeIdFromCache = CrawlerOptions::get( $optionName, '' );

		if ( ! empty( $attributeIdFromCache ) && ! is_null( wc_get_attribute( $attributeIdFromCache ) ) ) {
      CrawlerOptions::insert( $optionName, $attributeIdFromCache );
      BarrabesMapper::setAttributeId( $taxonomyLabel, $attributeIdFromCache );
			return $attributeIdFromCache;
		}

    $attributeFromSlug = wc_attribute_taxonomy_id_by_name( $taxonomySlug );
		if ( $attributeFromSlug ) {
      CrawlerOptions::insert( $optionName, $attributeFromSlug );
			BarrabesMapper::setAttributeId( $taxonomyLabel, $attributeFromSlug );
			return $attributeFromSlug;
		}

    $attribute_labels = wp_list_pluck( wc_get_attribute_taxonomies(), 'attribute_label', 'attribute_name' );
		$attribute_name   = array_search( $taxonomyLabel, $attribute_labels, true );

		$attributeFromLabel = wc_attribute_taxonomy_id_by_name( $attribute_name );


		if ( $attributeFromLabel ) {
      CrawlerOptions::insert( $optionName, $attributeFromLabel );
			BarrabesMapper::setAttributeId( $taxonomyLabel, $attributeFromLabel );
			return $attributeFromLabel;
		}
		
		$attribute_name = wc_sanitize_taxonomy_name( trim(substr($taxonomyLabel, 0, 27)) );

		$attribute_id = wc_create_attribute(
			array(
				'name'         => $taxonomyLabel,
				'slug'         => $attribute_name,
				'type'         => 'select',
				'order_by'     => 'menu_order',
				'has_archives' => false,
			)
		);

		if ( !is_wp_error( $attribute_id ) ) {
			$taxonomy_name = wc_attribute_taxonomy_name( $attribute_name );

			register_taxonomy(
				$taxonomy_name,
				apply_filters( 'woocommerce_taxonomy_objects_' . $taxonomy_name, array( 'product' ) ),
				apply_filters(
					'woocommerce_taxonomy_args_' . $taxonomy_name,
					array(
						'label' 			 => $taxonomyLabel,
						'hierarchical' => false,
						'show_ui'      => false,
						'query_var'    => true,
						'rewrite'      => false,
					)
				)
			);
		}

		BarrabesMapper::setAttributeId( $taxonomyLabel, $attribute_id );
		return $attribute_id;
	}

  protected function getProductId( $url, $sku ) {
    if ( ! empty ( $sku ) ) {
      $productId = wc_get_product_id_by_sku( 'BB-' . $sku, 32 );
      if ( ! empty( $productId ) ) {
        return $productId;
      }
    }

    $productId = BarrabesMapper::getProductId( $url );

    if ( ! empty( $productId ) ) {
      return $productId;
    }

    return null;
  }

  protected function getVariationId( $variationSku, $variationAttributes, $wc_product ) {
    if ( ! empty( $variationSku ) ) {
      $variationIdBySku = wc_get_product_id_by_sku( 'BB-' . $variationSku, 32 );
      if ( ! empty( $variationIdBySku ) ) {
        return $variationIdBySku;
      }
    }

		$variationIdByAttribute = $this->getVariationIdByAttributes( $variationAttributes, $wc_product );
    if ( ! empty( $variationIdByAttribute ) ) {
      return $variationIdByAttribute;
    }

    return null;
  }

  private function getVariationIdByAttributes( $variationAttributes, $wc_product ) {
		$data_store = \WC_Data_Store::load( 'product' );

    $attributes = [];

    foreach ( $variationAttributes as $name => $value ) {
      $attributes[ 'attribute_' . $name ] = $value;
    }

		return $data_store->find_matching_product_variation( $wc_product, $attributes );
	}

  protected function getWoocommerceProduct( string $url, string $sku, bool $isVariable ) {
    $productId = $this->getProductId( $url, $sku );
		$new_product = true;

		if ( $productId ) {
			$new_product = false;
			$product = wc_get_product( $productId );		

			if ( $product && 0 < $product->get_parent_id() ) {
				$productId = $product->get_parent_id();
			}
		}

    if ( $isVariable ) {
			return [new \WC_Product_Variable((int) $productId ), $new_product];
		}

		return [new \WC_Product((int) $productId ), $new_product];
  }

  private function getWoocommerceVariation( $variationSku, $product, $variationAttributes ) {
		$variationId = $this->getVariationId( $variationSku, $variationAttributes, $product );
		$variation = new \WC_Product_Variation( $variationId );
		return $variation;
	}

  protected function getWoocommerceVariationAttributes( $product ) {
    $formattedAttributes = [];
    $attributes = $product['attributes'];

    foreach ( $attributes as $attribute ) {
      $taxName =  wc_attribute_taxonomy_name( wc_sanitize_taxonomy_name( stripslashes( $attribute['name'] ) ) );

      if ( isset( $this->taxonomies[ $taxName ] ) ) {
        $taxName = $this->taxonomies[ $taxName ];
      }

			$values = $attribute['value'];
      $value = is_array( $values ) ? $values[0] : $values;

      $attrValSlug = wc_sanitize_taxonomy_name( sanitize_title( stripslashes( $value ) ) );
      $formattedAttributes[$taxName] = $attrValSlug;
    }

    return $formattedAttributes;
  }

  private function setMultinventoryData( $product, $price, $stockStatus ) {
		if ( empty( $this->stock ) || $product->is_type( 'variable' ) ) {
			return;
		}

		do_action( 'lb_multi_inventory_set_stock', $product->get_id(), $this->stock, $price, $stockStatus, $product );
	}

  protected function saveProduct( $product, bool $changed, $price, $availability ) {
    do_action( 'lb_multi_inventory_remove_stock_hooks' );

		if ( $changed ) $product->save();

		$this->setMultinventoryData( $product, $price, $availability );

		do_action( 'lb_multi_inventory_add_stock_hooks' );
  }

  protected function setPriceAndStock( $product, $price, $stockStatus ) {
		if ( empty ( $this->stock ) ) {
			$currentPrice = $product->get_meta( '_main_price' );
      $currentStockAvailability = $product->get_meta( '_main_stock_status' );

			$product->set_regular_price($price);
			$product->set_stock_status( $stockStatus );
			$product->update_meta_data( '_main_price', $price );
			$product->update_meta_data( '_main_stock_status', $stockStatus );

			if ( $currentPrice != $price || $currentStockAvailability != $stockStatus ) {
				return true;
			}
		}

		return false;
	}
}
