<?php

namespace LucasBarbosa\LbCrawlersReceiver\Barrabes\Admin;

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Admin\PluginSettings;
use LucasBarbosa\LbCrawlersReceiver\Barrabes\Admin\SaveSettingsAjax;

class AdminInit {
  public function run( $plugin_name, $version ) {
    $settings = new PluginSettings( $plugin_name, $version );
    $settings->run();

    $ajax = new SaveSettingsAjax();
    $ajax->run();
  }
}
