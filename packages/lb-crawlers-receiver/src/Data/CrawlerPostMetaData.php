<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class CrawlerPostMetaData {
  private static $table_name = "lb_crawler_post_meta";

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
      post_id bigint(20) NOT NULL,
      meta_key text(80) NOT NULL,
      meta_value longtext,
      PRIMARY KEY (id),
      UNIQUE KEY uc_lb_crawler_post_meta (post_id, meta_key(35))
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
  }

  public static function delete( $id ) {
    global $wpdb;

    if ( empty( $id ) ) return;

    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare(
      "DELETE FROM {$table_name} WHERE post_id = %s",
      $id
    );

    $wpdb->query( $query );
  }

  public static function insert( $post_id, $meta_key, $meta_value ) {
    global $wpdb;

    if ( empty( $post_id ) || empty( $meta_key ) || empty( $meta_value ) ) return;

    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare( "INSERT INTO {$table_name} (post_id, meta_key, meta_value) VALUES (%d, %s, %s) ON DUPLICATE KEY UPDATE meta_value=meta_value", $post_id, $meta_key, maybe_serialize( $meta_value ) );
    $wpdb->query( $query );
  }

  public static function get( $post_id, $meta_key ) {
    global $wpdb;

    if ( empty( $post_id ) || empty( $meta_key ) ) return null;

    $table_name = self::getTableName();
    
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE meta_key = %s AND post_id = %d LIMIT 1", $meta_key, $post_id );
    $result = $wpdb->get_results( $query, ARRAY_A );

    if ( empty( $result ) ) {
      return null;
    }

    $post_meta = array_shift( $result );

    if ( isset( $post_meta['meta_value'] ) ) {
      $post_meta['meta_value'] = maybe_unserialize( $post_meta['meta_value'] );
      return $post_meta['meta_value'];
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

    $post_meta = array_shift( $result );

    if ( isset( $post_meta['meta_value'] ) ) {
      $post_meta['meta_value'] = maybe_unserialize( $post_meta['meta_value'] );
      return $post_meta;
    }

    return null;
  }

  public static function getByMeta( $meta_key, $meta_value ) {
    global $wpdb;

    if ( empty( $meta_key ) || empty( $meta_value ) ) return null;

    $table_name = self::getTableName();
    
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE meta_key = %s AND meta_value = %s LIMIT 1", $meta_key, $meta_value );
    $result = $wpdb->get_results( $query, ARRAY_A );

    if ( empty( $result ) ) {
      return null;
    }

    $post_meta = array_shift( $result );

    if ( isset( $post_meta['meta_value'] ) ) {
      $post_meta['meta_value'] = maybe_unserialize( $post_meta['meta_value'] );
      return $post_meta;
    }

    return null;
  }

  public static function getByMetaLike( $meta_key, $meta_value_like, $meta_value ) {
    global $wpdb;

    if ( empty( $meta_key ) || empty( $meta_value ) ) return null;

    $table_name = self::getTableName();
    
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE meta_key = %s and (meta_value LIKE %s or meta_value = %s) LIMIT 1", $meta_key, $meta_value_like, $meta_value );
    $result = $wpdb->get_results( $query, ARRAY_A );

    if ( empty( $result ) ) {
      return null;
    }

    $post_meta = array_shift( $result );

    if ( isset( $post_meta['meta_value'] ) ) {
      $post_meta['meta_value'] = maybe_unserialize( $post_meta['meta_value'] );
      return $post_meta;
    }

    return null;
  }
}
