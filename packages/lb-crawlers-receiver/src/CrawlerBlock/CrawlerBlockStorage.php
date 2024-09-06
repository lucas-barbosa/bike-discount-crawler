<?php

namespace LucasBarbosa\LbCrawlersReceiver\CrawlerBlock;

class CrawlerBlockStorage {
  private static $table_name = 'lb_rejected_products';
  
  private static function getTableName() {
    global $wpdb;
  	return $wpdb->prefix . self::$table_name;
  }

  static function createTable() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    $table_name = self::getTableName();

    $sql = "CREATE TABLE IF NOT EXISTS {$table_name} (
      id int NOT NULL AUTO_INCREMENT,
      url varchar(255) NOT NULL,
      PRIMARY KEY (id)
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
  }

  static function insert( $url ) {
    global $wpdb;

    if ( empty( $url ) || ! is_null( self::get( $url ) ) ) {
      return;
    }

    $sanitizedUrl = strtok( $url, '?' );
    $table_name = self::getTableName(); 
    
    $query = $wpdb->prepare( "INSERT INTO {$table_name} (url) VALUES (%s);", $sanitizedUrl );
    
    $wpdb->query( $query );
  }

  static function get( $url ) {
    global $wpdb;
  
    if ( empty( $url ) ) return null;
  
    $table_name = self::getTableName();
      
    $sanitizedUrl = strtok( $url, '?' );
    $query = $wpdb->prepare( "SELECT * FROM {$table_name} WHERE url = %s", $sanitizedUrl );
    $results = $wpdb->get_results( $query, ARRAY_A );

    if ( count( $results ) === 0 ) {
      return null;
    }

    return array_shift( $results );
  }
}
