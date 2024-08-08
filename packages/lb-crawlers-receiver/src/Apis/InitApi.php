<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

class InitApi {
  function run() {
    new SettingsApi();
    new StockApi();
    new OldStockApi();
    new CategoriesApi();
    new ProductApi();
    new ProductImageApi();
    new TranslateApi();
  }
}
