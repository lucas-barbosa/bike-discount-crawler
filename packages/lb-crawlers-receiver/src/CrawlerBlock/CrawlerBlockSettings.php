<?php

namespace LucasBarbosa\LbCrawlersReceiver\CrawlerBlock;

class CrawlerBlockSettings {
  public function __construct() {
    add_action( 'admin_action_lb_block_crawler', array( $this, 'run_single_block' ) );
    add_action( 'post_submitbox_start', array( $this, 'add_run_button' ), 20, 2 );
  }

  function add_run_button() {
		global $post;

		if ( ! current_user_can( 'manage_woocommerce' ) || ! is_object( $post ) || 'product' !== $post->post_type ) {
			return;
		}

		$notify_url = wp_nonce_url( admin_url( 'edit.php?post_type=product&action=lb_block_crawler&post=' . absint( $post->ID ) ),'lb_block_crawler_' . $post->ID );

    ?>
		<div style="margin: 10px 0">
      <a class="button button-secondary" href="<?php echo esc_url( $notify_url ); ?>">Bloquear Crawler</a>
    </div>
		<?php
	}

  function run_single_block() {
    if ( empty( $_REQUEST['post'] ) ) {
			wp_die( esc_html__( 'No product to sync has been supplied!', 'woocommerce' ) );
		}

		$product_id = isset( $_REQUEST['post'] ) ? absint( $_REQUEST['post'] ) : '';

		check_admin_referer( 'lb_block_crawler_' . $product_id );

		do_action( 'lb_crawler_block_single_execute', $product_id );

		wp_redirect( admin_url( 'post.php?action=edit&post=' . $product_id ) );
		exit;
	}
}
