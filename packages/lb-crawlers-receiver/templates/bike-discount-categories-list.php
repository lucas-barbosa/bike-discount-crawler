<section>
  <form method="POST" action="admin-post.php" id="lb-bike-discount-categories">
    <input type="hidden" name="action" value="lb_bike_discount_crawler_available_categories">
    <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_bike_discount_crawler_nonce' ) ?>">

    <header class="lb-bike-discount-inline">  
      <h2>Categorias Encontradas</h2>
      <button class="button-primary" type="submit" id="lb-bike-discount-save-categories">Salvar</button>
    </header>

    <p>Selecione as categorias que deseja buscar os produtos.</p>

    <ul id="lb-bike-discount-available-categories">
    </ul>
  </form>
</section>
