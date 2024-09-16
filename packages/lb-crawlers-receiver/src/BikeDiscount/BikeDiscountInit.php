<?php

namespace LucasBarbosa\LbCrawlersReceiver\BikeDiscount;

use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Admin\AdminInit;

class BikeDiscountInit {
  public function run() {
    if ( is_admin() ) {
      $admin = new AdminInit();
      $admin->run( LB_CRAWLERS_RECEIVER_NAME . '_bike_discount', LB_CRAWLERS_RECEIVER_VERSION );
    }
  }
}
