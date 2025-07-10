<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\SettingsStorage;

class SettingsData {
  private static $categoriesTree = 'lb_barrabes_cat_tree_';
  private static $deniedBrands = 'lb_barrabes_denied_brands';
  private static $parentCategory = 'lb_barrabes_category';
  private static $selectedCategoriesKey = 'lb_barrabes_selected_categories';
  private static $stockKey = 'lb_barrabes_stock';
  private static $categoriesKey = 'lb_barrabes_categories';
  private static $weightTableKey = 'lb_barrabes_weight_table';
  private static $maxSizeKey = 'lb_barrabes_max_size';
  private static $maxWeightKey = 'lb_barrabes_max_weight';
  private static $minPriceKey = 'lb_barrabes_min_price';
  private static $multiplicatorKey = 'lb_barrabes_multiplicator';
  private static $proMultiplicatorKey = 'lb_barrabes_pro_multiplicator';
  private static $categoriesDimension = 'lb_barrabes_categories_dimension';
  private static $categoriesWeight = 'lb_barrabes_categories_weight';
  private static $overrideWeightCategories = 'lb_barrabes_override_weight_categories';
  private static $viewedCategories = 'lb_barrabes_viewed_categories';
  private static $override_category_names = 'lb_barrabes_override_category_names';

  static function getOverrideCategories() {
    $data = SettingsStorage::get( self::$override_category_names );
    return is_null( $data ) ? [] : $data;
  }

  static function saveOverrideCategories( $categories ) {
    SettingsStorage::insert( self::$override_category_names, $categories );
  }

  static function getDeniedBrands() {
    return get_option( self::$deniedBrands, '' );
  }

  static function saveDeniedBrands( $brands ) {
    update_option( self::$deniedBrands, $brands, false );
  }

  static function getWeightSettings() {
    return get_option( self::$weightTableKey, [] );
  }

  static function saveWeightSettings( $data ) {
    update_option( self::$weightTableKey, $data, false );
  }
  
  static function getMaxWeight() {
    return get_option( self::$maxWeightKey, null );
  }

  static function saveMaxWeight( $weight ) {
    update_option( self::$maxWeightKey, $weight, false );
  }

  static function getMinPrice() {
    return get_option( self::$minPriceKey, 0 );
  }

  static function saveMinPrice( $value ) {
    update_option( self::$minPriceKey, $value, false );
  }

  static function getMaxSize() {
    return get_option( self::$maxSizeKey, null );
  }

  static function saveMaxSize( $value ) {
    update_option( self::$maxSizeKey, $value, false );
  }

  static function getStock() {
    return get_option( self::$stockKey, '' );
  }

  static function saveStock( $stock ) {
    update_option( self::$stockKey, $stock, false );
  }

  static function getCategories( $is_pro ) {
    return get_option( self::getCategoriesKey( $is_pro ), [] );
  }

  static function saveCategories( $categories, $is_pro ) {
    update_option( self::getCategoriesKey( $is_pro ), $categories, false );
  }

  static function getMultiplicator() {
    $value = (float)get_option( self::$multiplicatorKey, '1' );
    return is_numeric( $value ) ? $value : 1;
  }

  static function getProMultiplicator() {
    $value = (float)get_option( self::$proMultiplicatorKey, '1' );
    return is_numeric( $value ) ? $value : 1;
  }

  static function saveMultiplicator( $value ) {
    update_option( self::$multiplicatorKey, $value, false );
  }

  static function saveProMultiplicator( $value ) {
    update_option( self::$proMultiplicatorKey, $value, false );
  }

  static function getParentCategory() {
    return get_option( self::$parentCategory, '' );
  }

  static function saveParentCategory( $value) {
    update_option( self::$parentCategory, $value, false );
  }

  static function getSelectedCategories() {
    $data = SettingsStorage::get( self::$selectedCategoriesKey );
    return is_null( $data ) ? [] : $data;
  }

  static function saveSelectedCategories( $categories ) {
    SettingsStorage::insert( self::$selectedCategoriesKey, $categories );
  }

  static function saveCategoriesTree( $category, $tree ) {
    update_option( self::$categoriesTree . '_' . $category, $tree, false );
  }

  static function getCategoriesTree( $category ) {
    return get_option( self::$categoriesTree . '_' . $category, [] );
  }

  static function saveCategoriesDimension( $value ) {
    SettingsStorage::insert( self::$categoriesDimension, $value );
  }

  static function saveCategoriesOverrideWeight( $value ) {
    SettingsStorage::insert( self::$overrideWeightCategories, $value );
  }

  static function saveCategoriesWeight( $value ) {
    SettingsStorage::insert( self::$categoriesWeight, $value );
  }

  static function saveViewedCategories( $value ) {
    SettingsStorage::insert( self::$viewedCategories, $value );
  }
  
  static function getCategoriesDimension() {
    $data = SettingsStorage::get( self::$categoriesDimension );
    return is_null( $data ) ? [] : $data;
  }

  static function getCategoriesOverrideWeight() {
    $data = SettingsStorage::get( self::$overrideWeightCategories );
    return is_null( $data ) ? [] : $data;
  }

  static function getCategoriesWeight() {
    $data = SettingsStorage::get( self::$categoriesWeight );
    return is_null( $data ) ? [] : $data;
  }

  static function getViewedCategories() {
    $data = SettingsStorage::get( self::$viewedCategories );
    return is_null( $data ) ? [] : $data;
  }

  static function getTotalPendingProducts() {
    global $wpdb;

    $query = "select count(post_id) from {$wpdb->prefix}postmeta pm where meta_key = '_lb_barrabes_url' and not exists (select 1 from {$wpdb->prefix}postmeta where meta_key = '_weight' and post_id = pm.post_id and meta_value > 0)";

    $result = $wpdb->get_var( $query );
    
    return $result;
  }

  private static function getCategoriesKey( $is_pro ) {
    $key = self::$categoriesKey;

    if ( $is_pro ) {
      $key .= '_pro';
    }

    return $key;
  }
}
