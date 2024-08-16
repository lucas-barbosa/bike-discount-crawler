<?php

namespace LucasBarbosa\LbCrawlersReceiver\TradeInn\Admin;

use LucasBarbosa\LbCrawlersReceiver\TradeInn\Admin\PluginSettings;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\Admin\SaveSettingsAjax;

class AdminInit {
  public function run( $plugin_name, $version ) {
    $settings = new PluginSettings( $plugin_name, $version );
    $settings->run();

    $ajax = new SaveSettingsAjax();
    $ajax->run();
  }
}
