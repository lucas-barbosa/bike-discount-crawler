<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn;

use LucasBarbosa\LbCrawlersReceiver\TradeInn\Admin\AdminInit;

class TradeInnInit {
  public function run() {
    if ( is_admin() ) {
      $admin = new AdminInit();
      $admin->run( LB_CRAWLERS_RECEIVER_NAME . '_tradeinn', LB_CRAWLERS_RECEIVER_VERSION );
    }
  }
}
