<?php

/**
 * @wordpress-plugin
 * Plugin Name:       LB Crawlers Receiver
 * Description:       API to receive crawlers updates
 * Version:           1.0.0
 * Author:            Lucas Barbosa
 * Author URI:        https://github.com/lucas-barbosa
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 */

use LucasBarbosa\LbCrawlersReceiver\Apis\InitApi;

if ( ! defined( 'WPINC' ) ) {
  die;
}

require_once __DIR__ . '/vendor/autoload.php';

$api = new InitApi();
$api->run();
