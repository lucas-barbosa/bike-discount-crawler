<?php

namespace LucasBarbosa\LbCrawlersReceiver\Jobs;

class JobsInit {
  public function run() {
    CategoryBackfill::register();
  }
}
