<?php

/**
 * @wordpress-plugin
 * Plugin Name:       LB Crawlers Receiver
 * Description:       API to receive crawlers updates
 * Version:           1.0.1
 * Author:            Lucas Barbosa
 * Author URI:        https://github.com/lucas-barbosa
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 */

use LucasBarbosa\LbCrawlersReceiver\Apis\InitApi;
use LucasBarbosa\LbCrawlersReceiver\Barrabes\BarrabesInit;
use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\BikeDiscountInit;
use LucasBarbosa\LbCrawlersReceiver\Common\Categories;
use LucasBarbosa\LbCrawlersReceiver\CrawlerBlock\CrawlerBlockStorage;
use LucasBarbosa\LbCrawlersReceiver\CrawlerBlock\InitCrawlerBlock;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerOptions;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerPostMetaData;
use LucasBarbosa\LbCrawlersReceiver\Data\CrawlerTermMetaData;
use LucasBarbosa\LbCrawlersReceiver\Data\SettingsStorage;
use LucasBarbosa\LbCrawlersReceiver\Jobs\JobsInit;
use LucasBarbosa\LbCrawlersReceiver\TradeInn\TradeInnInit;

if ( ! defined( 'WPINC' ) ) {
  die;
}

require_once __DIR__ . '/vendor/autoload.php';

define( 'LB_CRAWLERS_RECEIVER', plugin_basename( __FILE__ ) );
define( 'LB_CRAWLERS_RECEIVER_DIR', plugin_dir_path( __FILE__ ) );
define( 'LB_CRAWLERS_RECEIVER_FILE', __FILE__ );
define( 'LB_CRAWLERS_RECEIVER_NAME', 'lb_crawlers_receiver' );
define( 'LB_CRAWLERS_RECEIVER_VERSION', '1.0.1+beta6' );

function lb_crawlers_receiver_activate() { 
	CrawlerBlockStorage::createTable();
  CrawlerOptions::createTable();
  SettingsStorage::createTable();
  CrawlerPostMetaData::createTable();
  CrawlerTermMetaData::createTable();
}

register_activation_hook( __FILE__, 'lb_crawlers_receiver_activate' );

// $blocker = new InitCrawlerBlock();
// $blocker->run();

$api = new InitApi();
$api->run();

$barrabes = new BarrabesInit();
$barrabes->run();

$bikeDiscount = new BikeDiscountInit();
$bikeDiscount->run();

$tradeinn = new TradeInnInit();
$tradeinn->run();

$jobs = new JobsInit();
$jobs->run();

Categories::init();
