<?php

use LucasBarbosa\LbCrawlersReceiver\Barrabes\Data\SettingsData;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if( current_user_can( 'manage_woocommerce' ) ) {
  $getCategoriesUrl = wp_nonce_url( admin_url( 'admin.php?page=lb-barrabes&action=barrabes_crawler_categories' ), 'lb-barrabes_find-categories' );
  $runCrawlerUrl = wp_nonce_url( admin_url( 'admin.php?page=lb-barrabes&action=barrabes_start_categories_crawler' ), 'lb-barrabes_crawler' );
  $deleteProductsUrl = wp_nonce_url( admin_url( 'admin.php?page=lb-barrabes&action=barrabes_delete_products' ), 'lb-barrabes_crawler' );

  $terms = get_terms([
    'taxonomy' => 'inventories',
    'hide_empty' => false,
  ]);

  $currentStock = SettingsData::getStock();
  $multiplicator = SettingsData::getMultiplicator();
  $proMultiplicator = SettingsData::getProMultiplicator();
  $parentCategory = SettingsData::getParentCategory();

  $categories = get_terms( 'product_cat', [ 'hide_empty' => false, 'parent' => 0 ] );

  $stocks = [];

  foreach ( $terms as $term ) {
    $stocks[$term->term_id] = $term->name;
  }

  ?>

  <div id="barrabes-settings">
    <h1>Barrabes Crawler</h1>

    <form method="POST" action="admin-post.php">
      <input type="hidden" name="action" value="lb_barrabes_crawler_stock">
      <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_barrabes_crawler_nonce' ) ?>">

      <div>
        <label>Categoria Raiz:</label>

        <select name="lb_barrabes_category">
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

        <select name="lb_barrabes_stock">
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
        <label for="barrabes-multiplicator">Fator Multiplicador de Preço</label>
        <input type="number" step="any" min="0" name="lb_barrabes_multiplicator" value="<?php echo $multiplicator; ?>">
      </div>

      <div style="margin: 5px 0;">
        <label for="barrabes-multiplicator">Fator Multiplicador de Preço (Pro)</label>
        <input type="number" step="any" min="0" name="lb_barrabes_pro_multiplicator" value="<?php echo $proMultiplicator; ?>">
      </div>

      <button class="button-primary" type="submit">Salvar</button>
    </form>

    <br>
    <a href="<?php echo esc_url( $deleteProductsUrl); ?>" class="button-secondary">Deletar Produtos de Categorias Não Selecionadas</a>

    <hr />

    <section>
      <h2>Tabela de Preços</h2>

      <form method="POST" action="admin-post.php">
        <input type="hidden" name="action" value="lb_barrabes_crawler_weight_settings">
        <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_barrabes_crawler_nonce' ) ?>">

        <table id="lb-barrabes-weight-settings" class="lb-table widefat" style="max-width: 650px">
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
                <button class="button-secondary" type="button" id="lb-barrabes-new-line">Adicionar Linha</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </form>
    </section>

    <hr />

    <form method="POST" action="admin-post.php" id="lb-barrabes-available-categories-form">
      <div class="barrabes-sections">
        <section>
          <header class="lb-barrabes-inline">  
            <h2>Categorias Encontradas na Barrabes</h2>
            <button class="button-primary" type="submit" id="lb-barrabes-save-categories">Salvar</button>
          </header>

          <input type="hidden" name="action" value="lb_barrabes_crawler_categories">
          <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_barrabes_crawler_nonce' ) ?>">

          <p>Selecione as categorias que deseja buscar os produtos.</p>

          <ul id="lb-barrabes-available-categories">
          </ul>
        </section>

        <br />

        <section>
          <header class="lb-barrabes-inline">  
            <h2>Categorias Encontradas na Barrabes Pro</h2>
          </header>

          <p>Selecione as categorias que deseja buscar os produtos.</p>

          <ul id="lb-barrabes-pro-available-categories">
          </ul>
        </section>
      </div>
    </form>

    <hr />

    <section style="max-width: 500px">
      <form method="POST" action="admin-post.php">
        <header class="lb-barrabes-inline">  
          <h2>Marcas Proibidas</h2>
          <button class="button-primary" type="submit">Salvar</button>
        </header>

        <input type="hidden" name="action" value="lb_barrabes_denied_brands">
        <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_barrabes_crawler_nonce' ) ?>">

        <textarea name="denied_brands" rows="15" style="width: 100%"><?php echo SettingsData::getDeniedBrands(); ?></textarea>
      </form>
    </section>

    <hr />

    <div style="display: flex; align-items: center;gap: 10px;">
      <form method="POST" action="admin-post.php">
        <input type="hidden" name="action" value="lb_barrabes_crawler_product_by_url">
        <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_barrabes_crawler_nonce' ) ?>">

        <label>Executar Crawler através da Url do Produto:</label>
        <input type="text" name="lb_barrabes_url" required>
        <button class="button-secondary">Processar</button>
      </form>
    </div>
  </div>
<?php
  return;
}
?>

<p>You are not authorized to perform this operation.</p>
