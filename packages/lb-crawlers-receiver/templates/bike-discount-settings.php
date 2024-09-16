<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if( current_user_can( 'manage_woocommerce' ) ) {
?>

  <style>.lb-table td,.lb-table th{vertical-align:middle!important}.lb-table tbody tr:nth-child(odd){background-color:#f5f5f5}.lb-table tfoot button+button{margin-left:8px!important}.lb-weight-input{max-width:70px}.lb-weight-input::-webkit-inner-spin-button,.lb-weight-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.lb-weight-input+span{margin-left:4px}.lb-bike-discount-inline{display:flex;flex-direction:row;align-items:center;gap:1rem}.bike-discount-sections { display:flex; flex-direction: row; gap: 20px; flex-wrap: wrap; }.lb-bike-discount-subitems {margin-left: 1rem;margin-top: .5rem;}</style>
  
  <div id="bike-discount-settings">
    <h1>Bike Discount Crawler</h1>

    <?php require_once 'bike-discount-plugin-settings.php'; ?>

    <hr />

    <div class="bike-discount-sections">
      <?php require_once 'bike-discount-price-table.php'; ?>
      <?php require_once 'bike-discount-categories-list.php'; ?>
    </div>

    <hr />

    <?php require_once 'bike-discount-denied-brands.php'; ?>
  </div>
<?php
  return;
}
?>

<p>You are not authorized to perform this operation.</p>
