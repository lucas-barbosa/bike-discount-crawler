<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Admin;

use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData;

class SaveSettingsAjax {
  public function run() {
    add_action('wp_ajax_tradeinn_process_selected_categories', array($this, 'process_selected_categories'));
    add_action('wp_ajax_tradeinn_process_categories_dimension', array($this, 'process_categories_dimension'));
    add_action('wp_ajax_tradeinn_process_categories_weight', array($this, 'process_categories_weight'));
    add_action('wp_ajax_tradeinn_process_viewed_categories', array($this, 'process_viewed_categories'));
    add_action('wp_ajax_tradeinn_process_override_weight_categories', array($this, 'process_override_weight_categories'));
  }

  public function process_selected_categories() {
    if ( ! $this->validate_permission() ) {
      return false;
    }

    $data = array();
    
    if ( isset( $_POST['categories'] ) ) {
      if ( isset( $_POST['categories'] ) && is_array( $_POST['categories'] ) ) {
        $data = $_POST['categories'];
        $data = array_filter( $data );
        $data = array_values( array_unique( $data ) );
      }
    }

    SettingsData::saveSelectedCategories($data);
    $filteredCategories = array_filter( $data, function( $item ) {
      return filter_var( $item, FILTER_VALIDATE_URL ) !== FALSE;
    });
    do_action( 'lb_crawlers_settings_changed', 'TT', 'selected_categories', array_values( $filteredCategories ) );

    return true;
  }

  public function process_categories_dimension() {
    if ( ! $this->validate_permission() ) {
      return false;
    }

    $categoriesDimension = array();

    if ( isset( $_POST['dimensions'] ) ) {
      foreach ( $_POST['dimensions'] as $key => $value ) {
        if ( $value > 0 ) $categoriesDimension[$key] = sanitize_text_field( $value );
      }
    }
    SettingsData::saveCategoriesDimension($categoriesDimension);
    do_action( 'lb_crawlers_settings_changed', 'TT', 'categories_dimension', $categoriesDimension );

    return true;
  }

  public function process_categories_weight() {
    if ( ! $this->validate_permission() ) {
      return false;
    }

    $categoriesWeight = array();

    if ( isset( $_POST['weights'] ) ) {
      foreach ( $_POST['weights'] as $key => $value ) {
        if ( $value > 0 ) $categoriesWeight[$key] = sanitize_text_field( $value );
      }
    }

    SettingsData::saveCategoriesWeight($categoriesWeight);
    do_action( 'lb_crawlers_settings_changed', 'TT', 'categories_weight', $categoriesWeight );

    return true;
  }

  public function process_viewed_categories() {
    if ( ! $this->validate_permission() ) {
      return false;
    }

    $viewedCategories = array();

    if ( isset( $_POST['viewed'] ) ) {
      if ( isset( $_POST['viewed'] ) && is_array( $_POST['viewed'] ) ) {
        $viewedCategories = $_POST['viewed'];
        $viewedCategories = array_filter( $viewedCategories );
        $viewedCategories = array_values( array_unique( $viewedCategories ) );
      }
    }

    SettingsData::saveViewedCategories($viewedCategories);

    return true;
  }

  public function process_override_weight_categories() {
    if ( ! $this->validate_permission() ) {
      return false;
    }

    $overrideWeightCategories = array();

    if ( isset( $_POST['overrides'] ) ) {
      if ( isset(  $_POST['overrides'] ) && is_array( $_POST['overrides'] ) ) {
        $overrideWeightCategories = $_POST['overrides'];
        $overrideWeightCategories = array_filter( $overrideWeightCategories );
        $overrideWeightCategories = array_values( array_unique( $overrideWeightCategories ) );
      }
    }

    SettingsData::saveOverrideWeightCategories($overrideWeightCategories);
    do_action( 'lb_crawlers_settings_changed', 'TT', 'override_categories', $overrideWeightCategories );
  }

  private function validate_permission() {
    if( ! wp_verify_nonce( $_POST['nonce'], 'lb_tradeinn_crawler_nonce' ) || !current_user_can( 'manage_woocommerce' ) ) {
      wp_send_json_error( 'Sem permissão para salvar!' );
      wp_die();
      return false;
    }
    
    return true;
  }
}
