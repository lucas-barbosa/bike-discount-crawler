<?php

use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Data\SettingsData as SettingsData;

?>

<section style="max-width: 500px">
  <form method="POST" action="admin-post.php">
    <header class="lb-bike-discount-inline">  
      <h2>Marcas Proibidas</h2>
      <button class="button-primary" type="submit">Salvar</button>
    </header>

    <input type="hidden" name="action" value="lb_bike_discount_denied_brands">
    <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_bike_discount_crawler_nonce' ) ?>">

    <textarea name="denied_brands" rows="15" style="width: 100%"><?php echo SettingsData::getDeniedBrands(); ?></textarea>
  </form>
</section>
