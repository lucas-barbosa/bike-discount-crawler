<?php

use LucasBarbosa\LbCrawlersReceiver\BikeDiscount\Data\SettingsData as SettingsData;

  $currentStock = SettingsData::getStock();
  $parentCategory = SettingsData::getParentCategory();
  $email = SettingsData::getEmail();
  $password = SettingsData::getPassword();

  $availableCategories = get_terms( 'product_cat', [ 'hide_empty' => false, 'parent' => 0 ] );

  $terms = get_terms([
    'taxonomy' => 'inventories',
    'hide_empty' => false,
  ]);

  $availableStocks = [];

  foreach ( $terms as $term ) {
    $availableStocks[$term->term_id] = $term->name;
  }
?>

<form method="POST" action="admin-post.php">
  <input type="hidden" name="action" value="lb_bike_discount_crawler_settings">
  <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_bike_discount_crawler_nonce' ) ?>">

  <div>
    <label>Categoria Raiz:</label>

    <select name="_lb_bike_discount_category">
      <option value="" <?php if ( empty( $parentCategory ) ): echo 'selected'; endif; ?>>Nenhuma</option>

      <?php
        foreach ( $availableCategories as $category ) {
          $id = $category->term_id;
          $name = $category->name;
          $selected = $parentCategory == $id ? 'selected' : '';
          
          echo "<option value='$id' $selected>$name</option>";
        }
      ?>
    </select>
  </div>

  <div style="margin: 5px 0;">
    <label>Estoque para popular:</label>

    <select name="_lb_bike_discount_stock">
      <option value="" <?php if ( empty( $currentStock ) ): echo 'selected'; endif; ?>>Estoque Principal</option>

      <?php
        foreach ( $availableStocks as $id => $stock ) {
          $selected = $currentStock == $id ? 'selected' : '';
          
          echo "<option value='$id' $selected>$stock</option>";
        }
      ?>
    </select>
  </div>

  <div style="margin: 5px 0;">
    <label for="_lb_bike_discount_email">Email de Acesso:</label>
    <input type="email" name="_lb_bike_discount_email" id="_lb_bike_discount_email" value="<?php echo $email; ?>">
  </div>

  <div style="margin: 5px 0;">
    <label for="_lb_bike_discount_password">Senha de Acesso</label>
    <input type="password" name="_lb_bike_discount_password" id="_lb_bike_discount_password" value="<?php echo $password; ?>">
  </div>
  
  <button class="button-primary" type="submit">Salvar</button>
</form>
