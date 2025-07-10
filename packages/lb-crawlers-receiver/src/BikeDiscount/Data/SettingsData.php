<?php

namespace LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Data;

use LucasBarbosa\LbCrawlersReceiver\Data\SettingsStorage;

class SettingsData {
  private static $options = [
    'available_categories'  => '_lb_bike_discount_categories',
    'categoriesDimension'   => '_lb_bike_discount_cat_dimension',
    'categoriesWeight'      => '_lb_bike_discount_cat_weight',
    'deniedBrands'          => '_lb_bike_discount_denied_brands',
    'email'                 => '_lb_bike_discount_email',
    'min_price'             => '_lb_bike_discount_min_price',
    'max_weight'            => '_lb_bike_discount_max_weight',
    'max_size'              => '_lb_bike_discount_max_size',
    'parent_category'       => '_lb_bike_discount_parent_category',
    'password'              => '_lb_bike_discount_password',
    'stock'                 => '_lb_bike_discount_stock',
    'override_weight_categories' => '_lb_bike_discount_override_weight_categories',
    'override_category_names' => '_lb_bike_discount_override_category_names',
    'selected_categories'   => '_lb_bike_discount_selected_categories',
    'viewed_categories'     => '_lb_bike_discount_viewed_categories',
    'weight_settings'       => '_lb_bike_discount_weight_settings',
  ];

  static function getCategories() {
    return get_option( self::$options['available_categories'], [] );
  }

  static function getOverrideCategories() {
    $data = SettingsStorage::get( self::$options['override_category_names'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getCategoriesDimension() {
    $data = SettingsStorage::get( self::$options['categoriesDimension'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getCategoriesTree( $category ) {
    return get_option( self::$options['categoriesTree'] . '_' . $category, [] );
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
    return get_option( self::$options['deniedBrands'], '' );
  }

  static function getEmail() {
    return get_option( self::$options['email'], '' );
  }

  static function getMinPrice() {
    return get_option( self::$options['min_price'], 0 );
  }

  static function getMaxSize() {
    return get_option( self::$options['max_size'], null );
  }

  static function getMaxWeight() {
    return get_option( self::$options['max_weight'], null );
  }

  static function getPassword() {
    return get_option( self::$options['password'], '' );
  }

  static function getStock() {
    return get_option( self::$options['stock'], '' );
  }

  static function getParentCategory() {
    return get_option( self::$options['parent_category'], '0' );
  }

  static function getWeightSettings() {
    return get_option( self::$options['weight_settings'], [] );
  }

  static function getSelectedCategories() {
    $data = SettingsStorage::get( self::$options['selected_categories'] );
    return is_null( $data ) ? [] : $data;
  }

  static function getViewedCategories() {
    $data = SettingsStorage::get( self::$options['viewed_categories'] );
    return is_null( $data ) ? [] : $data;
  }

  static function saveCategories( $categories ) {
    update_option( self::$options['available_categories'], $categories, false );
  }

  static function saveCategoriesDimension( $categories ) {
    SettingsStorage::insert( self::$options['categoriesDimension'], $categories );
  }

  static function saveCategoriesTree( $category, $tree ) {
    update_option( self::$options['categoriesTree'] . '_' . $category, $tree, false );
  }

  static function saveOverrideCategories( $categories ) {
    SettingsStorage::insert( self::$options['override_category_names'], $categories );
  }
  
  static function saveCategoriesWeight( $categories ) {
    SettingsStorage::insert( self::$options['categoriesWeight'], $categories );
  }

  static function saveDeniedBrands( $brands ) {
    update_option( self::$options['deniedBrands'], $brands, false );
  }

  static function saveEmail( $value ) {
    update_option( self::$options['email'], $value, false );
  }

  static function saveMinPrice( $price ) {
    update_option( self::$options['min_price'], $price, false );
  }

  static function saveMaxSize( $size ) {
    update_option( self::$options['max_size'], $size, false );
  }

  static function saveMaxWeight( $weight ) {
    update_option( self::$options['max_weight'], $weight, false );
  }
  
  static function saveParentCategory( $value ) {
    update_option( self::$options['parent_category'], $value, false );
  }

  static function savePassword( $value ) {
    update_option( self::$options['password'], $value, false );
  }

  static function saveSelectedCategories( $categories ) {
    SettingsStorage::insert( self::$options['selected_categories'], $categories );
  }

  static function saveStock( $stock ) {
    update_option( self::$options['stock'], $stock, false );
  }

  static function saveOverrideWeightCategories( $categories ) {
    SettingsStorage::insert( self::$options['override_weight_categories'], $categories );
  }

  static function saveViewedCategories( $categories ) {
    SettingsStorage::insert( self::$options['viewed_categories'], $categories );
  }

  static function saveWeightSettings( $data ) {
    update_option( self::$options['weight_settings'], $data, false );
  }
}
