(function ($) {
  'use strict';

  $(document).ready(() => {
    function deleteRow() {
      const row = $(this).parents('tr');
      row.remove();
    }

    function renderRow(min = '', max = '', price = '', maxSize = '') {
      const element = `
      <tr>
        <td>
          <input class="lb-weight-input" type="number" min="0" name="_min_weight[]" value="${min}">
          <span>gramas</span>
        </td>

        <td><b>até</b></td>

        <td>
          <input class="lb-weight-input" type="number" min="0" name="_max_weight[]" value="${max}">
          <span>gramas</span>
        </td>

        <td>
          <input class="lb-weight-input" type="number" min="0" name="_max_size[]" value="${maxSize}">
          <span>cm</span>
        </td>

        <td>
          <b>EUR</b>
          <input class="lb-weight-input" type="number" min="0" step="any" name="_min_price[]" value="${price}">
        </td>

        <td><button class="lb-weight-delete" type="button">Deletar</button>
      </tr>
      `;

      $('#lb-tradeinn-weight-settings tbody').append(element);
    }

    function renderTableData() {
      if (lb_crawlers_receiver_tradeinn && lb_crawlers_receiver_tradeinn.weight_settings) {
        if (lb_crawlers_receiver_tradeinn.weight_settings.length > 0) {
          lb_crawlers_receiver_tradeinn.weight_settings.map(el => renderRow(el.min_weight, el.max_weight, el.min_price, el.max_size || ''));
          return;
        }
      }

      renderRow();
    }

    $(document).on('click', '#lb-tradeinn-new-line', renderRow);
    $(document).on('click', '.lb-weight-delete', deleteRow);

    const selectedCategories = lb_crawlers_receiver_tradeinn.selected_categories || [];
    const viewedCategories = lb_crawlers_receiver_tradeinn.viewed_categories || [];
    const overrideWeight = lb_crawlers_receiver_tradeinn.override_weight || [];
    const categoriesWeight = lb_crawlers_receiver_tradeinn.categories_weight || {};
    const categoriesDimension = lb_crawlers_receiver_tradeinn.categories_dimension || {};

    const getCategoryWeight = (category) => {
      if (category && categoriesWeight[category]) return categoriesWeight[category];
      return '';
    }

    const getCategoryDimension = (category) => {
      if (category && categoriesDimension[category]) return categoriesDimension[category];
      return '';
    }

    function renderCategory(id, name, parent = '', value = '', title = true, hasChilds = true) {
      let storeName, storeId;

      if (!value) value = id;
      else {
        const splittedValue = value.split('|');
        storeName = splittedValue.shift();
        storeId = splittedValue.pop();
      }

      const element = `
        <li>
          <label id="lb-tradeinn-item_${id}">
            <input
              type="checkbox"
              name="sel_cat[]"
              value="${value}"
              ${value && selectedCategories.includes(value) ? 'checked' : ''}
              ${title ? `class="lb-tradeinn-title"` : ''}
            >
            ${hasChilds ? name : `<a href="${value}" target="_blank">${name}</a>`}
            ${title && hasChilds ? `<button class="lb-tradeinn-toggle" type="button">Exibir/Ocultar</button>` : ''}
          </label>

          ${title && hasChilds ? `<ul class="lb-tradeinn-subitems"></ul>` : ''}

          ${!hasChilds ? `
          <div style="display:inline-flex;gap:5px;align-items:center;">
            <div><input type="checkbox" name="vw_cat[]" value="${value}" ${value && viewedCategories.includes(value) ? 'checked' : ''}></div>
            <label><strong>Peso (g): </strong><input type="number" name="lt_wei[${value}]" style="width: 70px" min="0" step="any" value="${getCategoryWeight(value)}"></label>
            <label><strong>Dimensão (cm): </strong><input type="number" name="lt_dim[${value}]" style="width: 70px" min="0" step="any" value="${getCategoryDimension(value)}"></label>
            <label><input type="checkbox" name="ow_cat[]" value="${value}" ${value && overrideWeight.includes(value) ? 'checked' : ''}> Usar Peso?</label>
          </div>` : ''}
        </li>
      `;

      $(`#lb-tradeinn-available-categories ${parent}`).append(element);
    }

    const slugify = str =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    function renderAvailableCategories() {
      if (lb_crawlers_receiver_tradeinn && lb_crawlers_receiver_tradeinn.available_categories) {
        const categories = lb_crawlers_receiver_tradeinn.available_categories;

        const renderCategories = (items, parentSlug, parentValue) => {
          items.map(item => {
            const slug = `${parentSlug}${!!parentSlug ? '-' : ''}${slugify(item.name)}`;
            const hasChilds = item.childs && item.childs.length > 0 ? true : false;
            const parent = !parentSlug ? '' : `#lb-tradeinn-item_${parentSlug} ~ .lb-tradeinn-subitems`;

            renderCategory(slug, item.name, parent, !hasChilds ? item.url : '', hasChilds, hasChilds);

            if (hasChilds) renderCategories(item.childs, slug, !parentValue ? `${item.name}|${item.id}` : `${parentValue}|${item.id}`);
          });
        };


        if (!categories.length) {
          $('#lb-tradeinn-save-categories').prop('disabled', true);
          return;
        }

        renderCategories(categories, '', '');

        $('.lb-tradeinn-subitems').slideToggle();
      } else {
        $('#lb-tradeinn-save-categories').prop('disabled', true);
      }
    }

    function selectAll() {
      $(this).parent().parent().find('.lb-tradeinn-subitems li label[id^="lb-tradeinn-item"] input').prop('checked', this.checked);
    }

    function toggle() {
      $(this).parent().parent().children('.lb-tradeinn-subitems').slideToggle();
    }

    const getValues = (field_name) => {
      const $selCatInputs = $(field_name);
      const uniqueValues = [];

      $selCatInputs.each(function () {
        const value = $(this).val();

        if (value !== "" && uniqueValues.indexOf(value) === -1) {
          uniqueValues.push(value);
        }
      });

      return uniqueValues;
    }

    function handleError(errorMessage) {
      alert('Erro: ' + errorMessage);
      $('#tradeinn-categories').prop('disabled', false);
      $('#lb-tradeinn-save-categories').prop('disabled', false);
      $('#lb-tradeinn-save-categories').html('Salvar');
    }

    function processSelectedCategories() {
      const $categories = getValues('input[name="sel_cat[]"]:checked');

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_tradeinn.ajaxurl,
        data: {
          categories: $categories,
          action: 'tradeinn_process_selected_categories',
          nonce: lb_crawlers_receiver_tradeinn.nonce
        },
        dataType: 'JSON',
        success: function () {
          processViewedCategories();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          handleError(errorThrown);
        }
      });
    }

    function processViewedCategories() {
      const $categories = getValues('input[name="vw_cat[]"]:checked');

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_tradeinn.ajaxurl,
        data: {
          viewed: $categories,
          action: 'tradeinn_process_viewed_categories',
          nonce: lb_crawlers_receiver_tradeinn.nonce
        },
        dataType: 'JSON',
        success: function () {
          processOverrideCategories();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          handleError(errorThrown);
        }
      });
    }

    function processOverrideCategories() {
      const $categories = getValues('input[name="ow_cat[]"]:checked');

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_tradeinn.ajaxurl,
        data: {
          overrides: $categories,
          action: 'tradeinn_process_override_weight_categories',
          nonce: lb_crawlers_receiver_tradeinn.nonce
        },
        dataType: 'JSON',
        success: function () {
          processCategoriesDimension();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          handleError(errorThrown);
        }
      });
    }

    function processCategoriesDimension() {
      const $categories = {};

      $('input[name^="lt_dim["]').each(function () {
        const name = $(this).attr('name'); // Exemplo: lt_dim[lucas]
        const value = $(this).val();

        const match = /\[([^[\]]+)\]/.exec(name);

        if (match && value) {
          const key = match[1];
          $categories[key] = value;
        }
      });

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_tradeinn.ajaxurl,
        data: {
          dimensions: $categories,
          action: 'tradeinn_process_categories_dimension',
          nonce: lb_crawlers_receiver_tradeinn.nonce
        },
        dataType: 'JSON',
        success: function () {
          processCategoriesWeight();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          handleError(errorThrown);
        }
      });
    }

    function processCategoriesWeight() {
      const $categories = {};

      $('input[name^="lt_wei["]').each(function () {
        const name = $(this).attr('name'); // Exemplo: lt_dim[lucas]
        const value = $(this).val();

        const match = /\[([^[\]]+)\]/.exec(name);

        if (match && value) {
          const key = match[1];
          $categories[key] = value;
        }
      });

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_tradeinn.ajaxurl,
        data: {
          weights: $categories,
          action: 'tradeinn_process_categories_weight',
          nonce: lb_crawlers_receiver_tradeinn.nonce
        },
        dataType: 'JSON',
        success: function () {
          location.reload();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          handleError(errorThrown);
        }
      });
    }

    $(document).on('change', '.lb-tradeinn-title', selectAll);
    $(document).on('click', '.lb-tradeinn-toggle', toggle);
    $(document).on('submit', '#tradeinn-categories', function (e) {
      e.preventDefault();
      $('#tradeinn-categories').prop('disabled', true);
      $('#lb-tradeinn-save-categories').html('Aguarde');
      $('#lb-tradeinn-save-categories').prop('disabled', true);
      processSelectedCategories();
    });
    renderTableData();
    renderAvailableCategories();
  });
})(jQuery);
