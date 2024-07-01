<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

class InitApi {
  function run() {
    new SettingsApi();
    new StockApi();
    new CategoriesApi();
    new ProductApi();
  }
}
