<?php

namespace LucasBarbosa\LbCrawlersReceiver\Apis;

class InitApi {
  function run() {
    new StockApi();
    new CategoriesApi();
  }
}