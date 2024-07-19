<?php

namespace LucasBarbosa\LbCrawlersReceiver\Data;

class SettingsStorage {
  private static $table_name = "lb_crawler_settings";

  protected static function getTableName() {
    global $wpdb;
  	return $wpdb->prefix . self::$table_name;
  }

  public static function createTable() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    $table_name = self::getTableName();

    $sql = "CREATE TABLE IF NOT EXISTS {$table_name} (
      name varchar(191),
      data LONGTEXT not null,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_createdAt (createdAt)
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
  }

  public static function delete( $id ) {
    global $wpdb;

    if ( empty( $id ) ) return;

    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare(
      "DELETE FROM {$table_name} WHERE id = %s",
      $id
    );

    $wpdb->query( $query );
  }

  public static function insert( $name, $data ) {
    global $wpdb;

    if ( empty( $name ) ) return;

    $table_name = self::getTableName(); 
    
    if ( self::get( $name ) === $data ) return;
    
    $query = $wpdb->prepare( "INSERT INTO {$table_name} (name, data) VALUES (%s, %s)", $name, maybe_serialize( $data ) );
    $wpdb->query( $query );
  }

  public static function get( $name ) {
    global $wpdb;

    if ( empty( $name ) ) return null;

    $table_name = self::getTableName();
    
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE name = %s ORDER BY createdAt DESC LIMIT 1", $name );
    $result = $wpdb->get_results( $query, ARRAY_A );

    if ( empty( $result ) ) {
      return null;
    }

    $productData = array_shift( $result );

    if ( isset( $productData['data'] ) ) {
      return maybe_unserialize( $productData['data'] );
    }

    return null;
  }
}
