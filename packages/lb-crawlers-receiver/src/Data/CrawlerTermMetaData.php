<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class CrawlerTermMetaData {
  private static $table_name = "lb_crawler_term_meta";

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
      term_id bigint(20) NOT NULL,
      meta_key text(80) NOT NULL,
      meta_value longtext,
      PRIMARY KEY (id),
      UNIQUE KEY uc_lb_crawler_term_meta (term_id, meta_key(35)),
      INDEX (meta_key(35))
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
  }

  public static function delete( $id ) {
    global $wpdb;

    if ( empty( $id ) ) return;

    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare(
      "DELETE FROM {$table_name} WHERE term_id = %s",
      $id
    );

    $wpdb->query( $query );
  }

  public static function insert( $term_id, $meta_key, $meta_value ) {
    global $wpdb;

    if ( empty( $term_id ) || empty( $meta_key ) || empty( $meta_value ) ) return;

    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare( "INSERT INTO {$table_name} (term_id, meta_key, meta_value) VALUES (%d, %s, %s) ON DUPLICATE KEY UPDATE meta_value=meta_value", $term_id, $meta_key, maybe_serialize( $meta_value ) );
    $wpdb->query( $query );
  }

  public static function get( $term_id, $meta_key ) {
    global $wpdb;

    if ( empty( $term_id ) || empty( $meta_key ) ) return null;

    $table_name = self::getTableName();
    
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE meta_key = %s AND term_id = %d LIMIT 1", $meta_key, $term_id );
    $result = $wpdb->get_results( $query, ARRAY_A );

    if ( empty( $result ) ) {
      return null;
    }

    $term_meta = array_shift( $result );

    if ( isset( $term_meta['meta_value'] ) ) {
      $term_meta['meta_value'] = maybe_unserialize( $term_meta['meta_value'] );
      return $term_meta;
    }

    return null;
  }

  public static function getByMetaKey( $meta_key ) {
    global $wpdb;

    if ( empty( $meta_key ) ) return null;

    $table_name = self::getTableName();
    
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE meta_key = %s LIMIT 1", $meta_key );
    $result = $wpdb->get_results( $query, ARRAY_A );

    if ( empty( $result ) ) {
      return null;
    }

    $term_meta = array_shift( $result );

    if ( isset( $term_meta['meta_value'] ) ) {
      $term_meta['meta_value'] = maybe_unserialize( $term_meta['meta_value'] );
      return $term_meta;
    }

    return null;
  }
}
