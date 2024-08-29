<?php

use LucasBarbosa\LbCrawlersReceiver\CrawlerBlock\CrawlerBlockActions;
use LucasBarbosa\LbCrawlersReceiver\CrawlerBlock\CrawlerBlockSettings;

class InitCrawlerBlock {
  function run() {
    if ( is_admin() ) {
      add_filter( 'bulk_actions-edit-product', function( $actions ) {
        $actions['lb_crawler_block'] = 'Apenas Bloquear Crawler';
        $actions['lb_crawler_block_and_delete'] = 'Bloquear Crawler e Deletar Produto';
        return $actions;
      }); 
    
      add_action( 'load-edit.php', function() {
        global $typenow;
    
        $post_type = $typenow;
    
        if ( $post_type !== 'product' || ! isset( $_GET['action'] ) ) return;
    
        $action = $_GET['action'];
    
        if ( ! in_array( $action, [ 'lb_crawler_block', 'lb_crawler_block_and_delete' ] ) ) return;
    
        $post_ids = array();
    
        if ( isset( $_REQUEST['post'] ) && is_array( $_REQUEST['post'] ) ) {
          $post_ids = array_map( 'intval', $_REQUEST['post'] );
        }
    
        if ( empty( $post_ids ) ) return;
    
        $sendback = remove_query_arg( array( $action, 'untrashed', 'deleted', 'ids' ), wp_get_referer() );
    
        if ( ! $sendback ) $sendback = admin_url( "edit.php?post_type=$post_type" );
    
        do_action( $action . '_execute', $post_ids );
    
        wp_redirect( $sendback );
    
        exit();
      }, 10 );
    
      new CrawlerBlockSettings();
    }
    
    new CrawlerBlockActions();
  }
}
