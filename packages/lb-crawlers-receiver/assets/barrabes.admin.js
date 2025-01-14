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

      $('#lb-barrabes-weight-settings tbody').append(element);
    }

    function renderTableData() {
      if (lb_crawlers_receiver_barrabes && lb_crawlers_receiver_barrabes.weight_settings) {
        if (lb_crawlers_receiver_barrabes.weight_settings.length === 0) {
          renderRow();
          return;
        }

        lb_crawlers_receiver_barrabes.weight_settings.map(el => renderRow(el.min_weight, el.max_weight, el.min_price, el.max_size || ''));
      }
    }

    $(document).on('click', '#lb-barrabes-new-line', renderRow);
    $(document).on('click', '.lb-weight-delete', deleteRow);

    const selectedCategories = lb_crawlers_receiver_barrabes.selected_categories;
    const viewedCategories = lb_crawlers_receiver_barrabes.viewed_categories || [];
    const overrideWeight = lb_crawlers_receiver_barrabes.override_weight || [];
    const categoriesWeight = lb_crawlers_receiver_barrabes.categories_weight || {};
    const categoriesDimension = lb_crawlers_receiver_barrabes.categories_dimension || {};

    const getCategoryWeight = (category) => {
      if (category && categoriesWeight[category]) return categoriesWeight[category];
      return '';
    }

    const getCategoryDimension = (category) => {
      if (category && categoriesDimension[category]) return categoriesDimension[category];
      return '';
    }

    function renderCategory(root, id, name, parent = '', value = '', isTitle = true, hasChilds = true) {
      if (!value) value = id;

      const element = `
        <li>
          <label id="lb-barrabes-item_${id}">
            <input
              type="checkbox"
              name="sel_cat[]"
              value="${value}"
              ${value && selectedCategories.includes(value) ? 'checked' : ''}
              ${isTitle ? `class="lb-barrabes-title"` : ''}
            >${hasChilds ? name : `<a href="${value}" target="blank">${name}</a>`}
            ${isTitle && hasChilds ? `<button class="lb-barrabes-toggle" type="button">Exibir/Ocultar</button>` : ''}
            </label>

            ${isTitle && hasChilds ? `<ul class="lb-barrabes-subitems"></ul>` : ''}
            ${!hasChilds ? `
            <div style="display:inline-flex;gap:5px;align-items:center;">
              <div><input type="checkbox" name="vw_cat[]" value="${value}" ${value && viewedCategories.includes(value) ? 'checked' : ''}></div>
              <label><strong>Peso (g): </strong><input type="number" name="lt_wei[${value}]" style="width: 70px" min="0" step="any" value="${getCategoryWeight(value)}"></label>
              <label><strong>Dimensão (cm): </strong><input type="number" name="lt_dim[${value}]" style="width: 70px" min="0" step="any" value="${getCategoryDimension(value)}"></label>
              <label><input type="checkbox" name="ow_cat[]" value="${value}" ${value && overrideWeight.includes(value) ? 'checked' : ''}> Usar Peso?</label>
            </div>` : ''}
        </li>
      `;

      $(`${root} ${parent}`).append(element);
    }

    const slugify = str =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    function renderAvailableCategories(categories, listId, saveId) {
      if (!categories) {
        $(saveId).prop('disabled', true);
      }

      const renderCategories = (items, parentSlug) => {
        items.map(item => {
          const slug = `${parentSlug}${!!parentSlug ? '-' : ''}${slugify(item.name)}`;
          const hasChilds = item.childs && item.childs.length > 0 ? true : false;
          const parent = !parentSlug ? '' : `#lb-barrabes-item_${parentSlug} ~ .lb-barrabes-subitems`;

          renderCategory(listId, slug, item.name, parent, !hasChilds ? item.url : '', hasChilds, hasChilds);

          if (hasChilds) renderCategories(item.childs, slug);
        });
      };

      renderCategories(categories, '');
      $('.lb-barrabes-subitems').slideUp();
    }

    function selectAll() {
      $(this).parent().parent().find('.lb-barrabes-subitems li label[id^="lb-barrabes-item"] input').prop('checked', this.checked);
    }

    function toggle() {
      $(this).parent().parent().children('.lb-barrabes-subitems').slideToggle();
    }

    renderTableData();
    renderAvailableCategories(lb_crawlers_receiver_barrabes.barrabes_categories, '#lb-barrabes-available-categories', '#lb-barrabes-save-categories');
    renderAvailableCategories(lb_crawlers_receiver_barrabes.pro_categories, '#lb-barrabes-pro-available-categories', '#lb-barrabes-save-categories');

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
      $('#lb-barrabes-available-categories-form').prop('disabled', false);
      $('#lb-barrabes-save-categories').prop('disabled', false);
      $('#lb-barrabes-save-categories').html('Salvar');
    }

    function processSelectedCategories() {
      const $categories = getValues('input[name="sel_cat[]"]:checked');

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_barrabes.ajaxurl,
        data: {
          categories: $categories,
          action: 'barrabes_process_selected_categories',
          nonce: lb_crawlers_receiver_barrabes.nonce
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
        url: lb_crawlers_receiver_barrabes.ajaxurl,
        data: {
          viewed: $categories,
          action: 'barrabes_process_viewed_categories',
          nonce: lb_crawlers_receiver_barrabes.nonce
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
        url: lb_crawlers_receiver_barrabes.ajaxurl,
        data: {
          overrides: $categories,
          action: 'barrabes_process_override_weight_categories',
          nonce: lb_crawlers_receiver_barrabes.nonce
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
        url: lb_crawlers_receiver_barrabes.ajaxurl,
        data: {
          dimensions: $categories,
          action: 'barrabes_process_categories_dimension',
          nonce: lb_crawlers_receiver_barrabes.nonce
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
        url: lb_crawlers_receiver_barrabes.ajaxurl,
        data: {
          weights: $categories,
          action: 'barrabes_process_categories_weight',
          nonce: lb_crawlers_receiver_barrabes.nonce
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

    $(document).on('change', '.lb-barrabes-title', selectAll);
    $(document).on('click', '.lb-barrabes-toggle', toggle);
    $(document).on('submit', '#lb-barrabes-available-categories-form', function (e) {
      e.preventDefault();
      $('#lb-barrabes-available-categories-form').prop('disabled', true);
      $('#lb-barrabes-save-categories').html('Aguarde');
      $('#lb-barrabes-save-categories').prop('disabled', true);
      processSelectedCategories();
    });
  });
})(jQuery);
