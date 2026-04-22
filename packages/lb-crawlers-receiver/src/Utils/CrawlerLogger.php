<?php

namespace LucasBarbosa\LbCrawlersReceiver\Utils;

/**
 * Thin wrapper around \wc_get_logger() so crawler traces land in
 * WooCommerce → Status → Logs, grouped per source (e.g. lb-crawlers-stock.BD).
 *
 * debug() is gated so verbose traces don't pollute production. Enable with:
 *   define( 'LB_CRAWLERS_DEBUG', true );          // force-on
 *   define( 'WP_DEBUG', true );                   // piggy-back on WP_DEBUG
 *
 * warn() always writes — use it for unexpected branches.
 */
class CrawlerLogger {
  private static function enabled() {
    if ( defined( 'LB_CRAWLERS_DEBUG' ) && constant( 'LB_CRAWLERS_DEBUG' ) ) return true;
    if ( defined( 'WP_DEBUG' ) && constant( 'WP_DEBUG' ) ) return true;
    return false;
  }

  /** Each tag gets its own WC log file via a distinct source. */
  private static function source( $tag ) {
    return 'lb-crawlers-' . $tag;
  }

  /** WC's context convention is [ 'source' => ..., ...extra ]. */
  private static function wcContext( $tag, $context ) {
    return array_merge( array( 'source' => self::source( $tag ) ), (array) $context );
  }

  public static function debug( $tag, $message, $context = array() ) {
    if ( ! self::enabled() ) return;
    if ( ! function_exists( '\wc_get_logger' ) ) return;
    \wc_get_logger()->debug( $message, self::wcContext( $tag, $context ) );
  }

  /** Always logged (ignores the gate) — use for unexpected conditions. */
  public static function warn( $tag, $message, $context = array() ) {
    if ( ! function_exists( '\wc_get_logger' ) ) {
      // Fallback for environments where WC isn't loaded yet (shouldn't happen
      // on REST hits, but keeps warnings from silently vanishing).
      error_log( sprintf( '[lb-crawlers][%s] %s %s', $tag, $message, ! empty( $context ) ? wp_json_encode( $context ) : '' ) );
      return;
    }
    \wc_get_logger()->warning( $message, self::wcContext( $tag, $context ) );
  }
}
