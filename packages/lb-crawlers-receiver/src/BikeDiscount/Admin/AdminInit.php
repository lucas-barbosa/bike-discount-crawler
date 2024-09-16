<?php

namespace LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Admin;

use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Admin\PluginSettings;
use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Admin\SaveSettingsAjax;

class AdminInit {
  public function run( $plugin_name, $version ) {
    $settings = new PluginSettings( $plugin_name, $version );
    $settings->run();

    $ajax = new SaveSettingsAjax();
    $ajax->run();
  }
}
