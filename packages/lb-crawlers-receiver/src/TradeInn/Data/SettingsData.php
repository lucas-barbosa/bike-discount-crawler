<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\SettingsStorage;

class SettingsData {
  private static $options = [
    'available_categories'  => 'lb_tradeinn_categories',
    'categoriesDimension'   => '_lb_tradeinn_cat_dimension',
    'categoriesWeight'      => '_lb_tradeinn_cat_weight',
    'deniedBrands'          => 'lb_tradeinn_denied_brands',
    'min_price'             => 'lb_tradeinn_min_price',
    'max_size'              => 'lb_tradeinn_max_size',
    'max_weight'            => 'lb_tradeinn_max_weight',
    'multiplicator'         => 'lb_tradeinn_multiplicator',
    'parent_category'       => 'lb_tradeinn_parent_category',
    'stock'                 => 'lb_tradeinn_stock',
    'selected_categories'   => 'lb_tradeinn_selected_categories',
    'weight_settings'       => 'lb_tradeinn_weight_settings',
    'override_weight_categories' => '_lb_tradeinn_override_weight_categories',
    'viewed_categories'     => '_lb_tradeinn_viewed_categories',
    'override_category_names' => '_lb_tradeinn_override_category_names',
  ];

  static function getOverrideCategories() {
    $data = SettingsStorage::get( self::$options['override_category_names'] );
    return is_null( $data ) ? [] : $data;
  }

  static function saveOverrideCategories( $categories ) {
    SettingsStorage::insert( self::$options['override_category_names'], $categories );
  }

  static function getCategories() {
    $data = SettingsStorage::get( self::$options['available_categories'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getCategoriesDimension() {
    $data = SettingsStorage::get( self::$options['categoriesDimension'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getCategoriesOverrideWeight() {
    $data = SettingsStorage::get( self::$options['override_weight_categories'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getCategoriesWeight() {
    $data = SettingsStorage::get( self::$options['categoriesWeight'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getDeniedBrands() {
    $data = SettingsStorage::get( self::$options['deniedBrands'] );
    return is_null( $data ) ? '' : $data;
  }

  static function getMinPrice() {
    $data = SettingsStorage::get( self::$options['min_price'] );
    return is_null( $data ) ? 0 : $data;
  }

  static function getMaxSize() {
    return SettingsStorage::get( self::$options['max_size'] );
  }

  static function getMaxWeight() {
    return SettingsStorage::get( self::$options['max_weight'] );
  }

  static function getMultiplicator() {
    $value = SettingsStorage::get( self::$options['multiplicator'] );
    $value = is_null( $value ) ? '1' : (float)$value;
    return is_numeric( $value ) ? $value : 1;
  }

  static function getStock() {
    $data = SettingsStorage::get( self::$options['stock'] );
    return is_null( $data ) ? '' : $data;
  }

  static function getParentCategory() {
    $data = SettingsStorage::get( self::$options['parent_category'] );
    return is_null( $data ) ? 0 : $data;
  }

  static function getViewedCategories() {
    $data = SettingsStorage::get( self::$options['viewed_categories'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getWeightSettings() {
    $data = SettingsStorage::get( self::$options['weight_settings'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getSelectedCategories() {
    $data = SettingsStorage::get( self::$options['selected_categories'] );
    return is_null( $data ) ? [] : $data;
  }

  static function saveCategories( $categories ) {
    SettingsStorage::insert( self::$options['available_categories'], $categories );
  }

  static function saveCategoriesDimension( $categories ) {
    SettingsStorage::insert( self::$options['categoriesDimension'], $categories );
  }
  
  static function saveCategoriesWeight( $categories ) {
    SettingsStorage::insert( self::$options['categoriesWeight'], $categories );
  }

  static function saveDeniedBrands( $brands ) {
    SettingsStorage::insert( self::$options['deniedBrands'], $brands );
  }

  static function saveOverrideWeightCategories( $categories ) {
    SettingsStorage::insert( self::$options['override_weight_categories'], $categories );
  }

  static function saveViewedCategories( $categories ) {
    SettingsStorage::insert( self::$options['viewed_categories'], $categories );
  }

  static function saveMinPrice( $price ) {
    SettingsStorage::insert( self::$options['min_price'], $price );
  }

  static function saveMaxSize( $size ) {
    SettingsStorage::insert( self::$options['max_size'], $size );
  }

  static function saveMaxWeight( $weight ) {
    SettingsStorage::insert( self::$options['max_weight'], $weight );
  }

  static function saveMultiplicator( $value ) {
    SettingsStorage::insert( self::$options['multiplicator'], $value );
  }
  
  static function saveParentCategory( $value ) {
    SettingsStorage::insert( self::$options['parent_category'], $value );
  }

  static function saveSelectedCategories( $categories ) {
    SettingsStorage::insert( self::$options['selected_categories'], $categories );
  }

  static function saveStock( $stock ) {
    SettingsStorage::insert( self::$options['stock'], $stock );
  }

  static function saveWeightSettings( $data ) {
    SettingsStorage::insert( self::$options['weight_settings'], $data );
  }
}
