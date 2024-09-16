<section>
  <h2>Tabela de Preços</h2>

  <form method="POST" action="admin-post.php">
    <input type="hidden" name="action" value="lb_bike_discount_crawler_weight_settings">
    <input type="hidden" name="lb-nonce" value="<?php echo wp_create_nonce( 'lb_bike_discount_crawler_nonce' ) ?>">

    <table id="lb-bike-discount-weight-settings" class="lb-table widefat" style="max-width: 700px">
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
            <button class="button-secondary" type="button" id="lb-bike-discount-new-line">Adicionar Linha</button>
          </td>
        </tr>
      </tfoot>
    </table>
  </form>
</section>
