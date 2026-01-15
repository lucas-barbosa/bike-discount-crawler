<?php

namespace LucasBarbosa\LbCrawlersReceiver\Jobs;

class JobsInit {
  public function run() {
    CategoryBackfill::register();
    ParentCategoryBackfill::register();

    TradeInnDeleteProductsByCategoryJob::register();
    BarrabesDeleteProductsByCategoryJob::register();
    BikeDiscountDeleteProductsByCategoryJob::register();
  }
}
