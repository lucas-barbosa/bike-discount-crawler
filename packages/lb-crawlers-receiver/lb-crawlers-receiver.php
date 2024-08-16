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
use LucasBarbosa\LbCrawlersReceiver\Barrabes\BarrabesInit;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\TradeInnInit;

if ( ! defined( 'WPINC' ) ) {
  die;
}

require_once __DIR__ . '/vendor/autoload.php';

define( 'LB_CRAWLERS_RECEIVER', plugin_basename( __FILE__ ) );
define( 'LB_CRAWLERS_RECEIVER_DIR', plugin_dir_path( __FILE__ ) );
define( 'LB_CRAWLERS_RECEIVER_FILE', __FILE__ );
define( 'LB_CRAWLERS_RECEIVER_NAME', 'lb_crawlers_receiver' );
define( 'LB_CRAWLERS_RECEIVER_VERSION', '1.0.0+alpha' );

$api = new InitApi();
$api->run();

$barrabes = new BarrabesInit();
$barrabes->run();

$tradeinn = new TradeInnInit();
$tradeinn->run();
