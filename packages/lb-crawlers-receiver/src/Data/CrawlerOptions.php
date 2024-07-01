<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class CrawlerOptions {
  private static $table_name = "lb_crawler_options";

  protected static function getTableName() {
    global $wpdb;
  	return $wpdb->prefix . self::$table_name;
  }

  public static function createTable() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    $table_name = self::getTableName();

    $sql = "CREATE TABLE IF NOT EXISTS {$table_name} (
      id bigint(20) NOT NULL AUTO_INCREMENT,
      meta_key text(80) NOT NULL,
      meta_value longtext,
      PRIMARY KEY (id),
      UNIQUE KEY uc_lb_crawler_options_key (meta_key(80))
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
  }

  public static function delete( $key ) {
    global $wpdb;

    if ( empty( $key ) ) return;

    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare(
      "DELETE FROM {$table_name} WHERE meta_key = %s",
      $key
    );

    $wpdb->query( $query );
  }

  public static function insert( $meta_key, $meta_value ) {
    global $wpdb;

    if ( empty( $meta_key ) || empty( $meta_value ) ) return;

    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare( "INSERT INTO {$table_name} (meta_key, meta_value) VALUES (%s, %s) ON DUPLICATE KEY UPDATE meta_value=meta_value", $meta_key, maybe_serialize( $meta_value ) );
    $wpdb->query( $query );
  }

  public static function get( $meta_key, $fallback = null ) {
    global $wpdb;

    if ( empty( $meta_key ) ) return $fallback;

    $table_name = self::getTableName();
    
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE meta_key = %s LIMIT 1", $meta_key );
    $result = $wpdb->get_results( $query, ARRAY_A );

    if ( empty( $result ) ) {
      return $fallback;
    }

    $post_meta = array_shift( $result );

    if ( isset( $post_meta['meta_value'] ) ) {
      $post_meta['meta_value'] = maybe_unserialize( $post_meta['meta_value'] );
      return $post_meta['meta_value'];
    }

    return $fallback;
  }
}
