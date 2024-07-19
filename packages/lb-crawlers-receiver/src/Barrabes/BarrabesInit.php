<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Admin\AdminInit;

class BarrabesInit {
  public function run() {
    if ( is_admin() ) {
      $admin = new AdminInit();
      $admin->run( LB_CRAWLERS_RECEIVER_NAME . '_barrabes', LB_CRAWLERS_RECEIVER_VERSION );
    }
  }
}
