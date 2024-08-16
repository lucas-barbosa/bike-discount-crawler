<?php

use LucasBarbosa\LbCrawlersReceiver\TradeInn\Data\SettingsData;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if( current_user_can( 'manage_woocommerce' ) ) {
  $currentStock = SettingsData::getStock();
  $multiplicator = SettingsData::getMultiplicator();
  $parentCategory = SettingsData::getParentCategory();

  $categories = get_terms( 'product_cat', [ 'hide_empty' => false, 'parent' => 0 ] );

  $terms = get_terms([
    'taxonomy' => 'inventories',
    'hide_empty' => false,
  ]);

  $stocks = [];

  foreach ( $terms as $term ) {
    $stocks[$term->term_id] = $term->name;
  }

  ?>

  <style>.lb-table td,.lb-table th{vertical-align:middle!important}.lb-table tbody tr:nth-child(odd){background-color:#f5f5f5}.lb-table tfoot button+button{margin-left:8px!important}.lb-weight-input{max-width:70px}.lb-weight-input::-webkit-inner-spin-button,.lb-weight-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.lb-weight-input+span{margin-left:4px}.lb-tradeinn-inline{display:flex;flex-direction:row;align-items:center;gap:1rem}.tradeinn-sections { display:flex; flex-direction: row; gap: 20px;}.lb-tradeinn-subitems {margin-left: 1rem;margin-top: .5rem;}</style>
  
  <div id="tradeinn-settings">
    <h1>Tradeinn Crawler</h1>

    <form method="POST" action="admin-post.php">
      <input type="hidden" name="action" value="lb_tradeinn_crawler_stock">
      <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_tradeinn_crawler_nonce' ) ?>">

      <div>
        <label>Categoria Raiz:</label>

        <select name="lb_tradeinn_category">
          <option value="" <?php if ( empty( $parentCategory ) ): echo 'selected'; endif; ?>>Nenhuma</option>

          <?php
            foreach ( $categories as $category ) {
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

        <select name="lb_tradeinn_stock">
          <option value="" <?php if ( empty( $currentStock ) ): echo 'selected'; endif; ?>>Estoque Principal</option>

          <?php
            foreach ( $stocks as $id => $stock ) {
              $selected = $currentStock == $id ? 'selected' : '';
              
              echo "<option value='$id' $selected>$stock</option>";
            }
          ?>
        </select>
      </div>

      <div style="margin: 5px 0;">
        <label for="tradeinn-multiplicator">Fator Multiplicador de Preço</label>
        <input type="number" step="any" min="0" name="lb_tradeinn_multiplicator" value="<?php echo $multiplicator; ?>">
      </div>

      <button class="button-primary" type="submit">Salvar</button>
    </form>

    <br />

    <hr />

    <div class="tradeinn-sections">
      <section>
        <h2>Tabela de Preços</h2>

        <form method="POST" action="admin-post.php">
          <input type="hidden" name="action" value="lb_tradeinn_crawler_weight_settings">
          <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_tradeinn_crawler_nonce' ) ?>">

          <table id="lb-tradeinn-weight-settings" class="lb-table widefat" style="max-width: 650px">
            <thead>
              <tr>
                <th>Peso Mínimo</th>
                <th></th>
                <th>Peso Máximo</th>
                <th>Tamanho Máximo</th>
                <th>Valor Mínimo</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
            </tbody>

            <tfoot>
              <tr>
                <td colspan="6">
                  <button class="button-primary" type="submit">Salvar</button>
                  <button class="button-secondary" type="button" id="lb-tradeinn-new-line">Adicionar Linha</button>
                </td>
              </tr>
            </tfoot>
          </table>
        </form>
      </section>

      <section>
        <form method="POST" action="admin-post.php" id="tradeinn-categories">
          <input type="hidden" name="action" value="lb_tradeinn_crawler_available_categories">
          <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_tradeinn_crawler_nonce' ) ?>">

          <header class="lb-tradeinn-inline">  
            <h2>Categorias Encontradas</h2>
            <button class="button-primary" type="submit" id="lb-tradeinn-save-categories">Salvar</button>
          </header>

          <p>Selecione as categorias que deseja buscar os produtos.</p>

          <ul id="lb-tradeinn-available-categories">
          </ul>
        </form>
      </section>
    </div>

    <hr />

    <section style="max-width: 500px">
      <form method="POST" action="admin-post.php">
        <header class="lb-tradeinn-inline">  
          <h2>Marcas Proibidas</h2>
          <button class="button-primary" type="submit">Salvar</button>
        </header>

        <input type="hidden" name="action" value="lb_tradeinn_denied_brands">
        <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_tradeinn_crawler_nonce' ) ?>">

        <textarea name="denied_brands" rows="15" style="width: 100%"><?php echo SettingsData::getDeniedBrands(); ?></textarea>
      </form>
    </section>
  </div>
<?php
  return;
}
?>

<p>You are not authorized to perform this operation.</p>
