<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Admin;

use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData;

class PluginSettings {
  private $page_name = 'lb-tradeinn-v2';
  private $plugin_name;
  private $version;

  function __construct( $plugin_name, $version ) {
    $this->plugin_name = $plugin_name;
    $this->version = $version;
  }

  function run() {
    add_action( 'admin_post_lb_tradeinn_denied_brands', array( $this, 'handle_set_denied_brands' ) );
    add_action( 'admin_post_lb_tradeinn_crawler_available_categories', array( $this, 'handle_set_selected_categories' ) );
    add_action( 'admin_post_lb_tradeinn_crawler_stock', array( $this, 'handle_set_stock' ) );
    add_action( 'admin_post_lb_tradeinn_crawler_weight_settings', array( $this, 'handle_set_weight_settings' ) );
    add_action( 'admin_menu', array( $this, 'add_menu_option' ) );
    add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
  }

  function add_menu_option() {
    add_submenu_page(
      'woocommerce',
      'TradeInn Crawler v2',
      'TradeInn Crawler v2',
      'manage_woocommerce',
      $this->page_name,
      array( $this, 'render_page' )
    );
  }

  function enqueue_assets() {
    if ( ! isset( $_GET['page'] ) || $_GET['page'] !== $this->page_name ) {
      return;
    }

    wp_register_script( $this->plugin_name, plugins_url( 'assets/tradeinn.admin.js', LB_CRAWLERS_RECEIVER_FILE ), [ 'jquery' ], $this->version );

    wp_localize_script( $this->plugin_name, $this->plugin_name, array(
      'weight_settings' => SettingsData::getWeightSettings(),
      'available_categories'  => SettingsData::getCategories(),
      'selected_categories'   => SettingsData::getSelectedCategories(),
      'viewed_categories'     => SettingsData::getViewedCategories(),
      'categories_dimension'  => SettingsData::getCategoriesDimension(),
      'categories_weight'     => SettingsData::getCategoriesWeight(),
      'override_weight'       => SettingsData::getCategoriesOverrideWeight(),
      'ajaxurl'               => admin_url( 'admin-ajax.php' ),
      'nonce'                 => wp_create_nonce( 'lb_tradeinn_crawler_nonce' ),
    ) );
      
    wp_enqueue_script( $this->plugin_name );
	}
  
  function handle_set_weight_settings() {
    if( ! current_user_can( 'manage_woocommerce' ) || ! isset( $_POST['lb-nonce'] ) || ! wp_verify_nonce( $_POST['lb-nonce'], 'lb_tradeinn_crawler_nonce' ) ) {
      wp_die( __( 'Invalid nonce specified', $this->plugin_name ), __( 'Error', $this->plugin_name ), array(
        'response' 	=> 403,
        'back_link' => 'admin.php?page=' . $this->page_name,
      ) );

      return;
    }

    $data = array();

    if ( isset( $_POST['_min_price'] ) && is_array( $_POST['_min_price'] ) ) {
      for ( $i = 0; $i < count( $_POST['_min_price'] ); $i++ ) {
        $min_weight = sanitize_text_field( $_POST['_min_weight'][$i] );
        $max_weight = sanitize_text_field( $_POST['_max_weight'][$i] );
        $max_size = sanitize_text_field( $_POST['_max_size'][$i] );
        $price = sanitize_text_field( $_POST['_min_price'][$i] );

        if ( empty( $price ) || ( empty( $min_weight ) && empty( $max_weight ) && empty( $max_size ) ) ) {
          continue;
        }

        $data[] = array(
          'min_weight' => empty( $min_weight ) ? 0 : $min_weight,
          'max_weight' => $max_weight,
          'max_size'   => $max_size,
          'min_price'  => $price
        );
      }
    }

    $max_weights = array_column( $data, 'max_weight' );
    $max_weight = null;

    if ( count( $max_weights ) > 0 ) {
      rsort( $max_weights );
      $max_weight = $max_weights[0];
    }

    $min_prices = array_column( $data, 'min_price' );
    $min_price = 0;

    if ( count( $min_prices ) > 0 ) {
      sort( $min_prices );
      $min_price = $min_prices[0];
    }

    $max_sizes = array_column( $data, 'max_size' );
    $max_size = null;

    if ( count( $max_sizes ) > 0 ) {
      rsort( $max_sizes );
      $max_size = $max_sizes[0];
    }

    SettingsData::saveWeightSettings( $data );
    SettingsData::saveMaxWeight( $max_weight );
    SettingsData::saveMinPrice( $min_price );
    SettingsData::saveMaxSize( $max_size );
    do_action( 'lb_crawlers_settings_changed', 'TT', 'weight_table', [
      'data'      => $data,
      'min'       => $min_price,
      'maxWeight' => $max_weight,
      'maxSize'   => $max_size
    ] );

    wp_redirect( admin_url( 'admin.php?page=' . $this->page_name ) );
    exit;
  }

  function handle_set_denied_brands() {
    if( ! current_user_can( 'manage_woocommerce' ) || ! isset( $_POST['lb-nonce'] ) || ! wp_verify_nonce( $_POST['lb-nonce'], 'lb_tradeinn_crawler_nonce' ) ) {
      wp_die( __( 'Invalid nonce specified', $this->plugin_name ), __( 'Error', $this->plugin_name ), array(
        'response' 	=> 403,
        'back_link' => 'admin.php?page=' . $this->page_name,
      ) );

      return;
    }

    $brands = sanitize_textarea_field( $_POST['denied_brands'] );
    SettingsData::saveDeniedBrands( $brands );
    do_action( 'lb_crawlers_settings_changed', 'TT', 'denied_brands', $brands );

    wp_redirect( admin_url( 'admin.php?page=' . $this->page_name ) );
    exit;    
  }

  function handle_set_stock() {
    if( ! current_user_can( 'manage_woocommerce' ) || ! isset( $_POST['lb-nonce'] ) || ! wp_verify_nonce( $_POST['lb-nonce'], 'lb_tradeinn_crawler_nonce' ) ) {
      wp_die( __( 'Invalid nonce specified', $this->plugin_name ), __( 'Error', $this->plugin_name ), array(
        'response' 	=> 403,
        'back_link' => 'admin.php?page=' . $this->page_name,
      ) );

      return;
    }

    SettingsData::saveStock( $_POST['lb_tradeinn_stock'] );
    SettingsData::saveMultiplicator( sanitize_text_field( $_POST['lb_tradeinn_multiplicator'] ) );
    SettingsData::saveParentCategory( sanitize_text_field( $_POST['lb_tradeinn_category'] ) );
    
    wp_redirect( admin_url( 'admin.php?page=' . $this->page_name ) );
    exit;
  }

  function render_page() {
    if ( ! empty( $_REQUEST['action'] ) ) {
      $action = $_REQUEST['action'];
      do_action( "admin_action_{$action}" );
    }

    wc_get_template( 'tradeinn-settings.php', array(), 'woocommerce/tradeinn-crawler/', LB_CRAWLERS_RECEIVER_DIR . 'templates/' );
  }
}
