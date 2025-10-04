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

      $('#lb-bike-discount-weight-settings tbody').append(element);
    }

    function renderTableData() {
      if (lb_crawlers_receiver_bike_discount && lb_crawlers_receiver_bike_discount.weight_settings) {
        if (lb_crawlers_receiver_bike_discount.weight_settings.length > 0) {
          lb_crawlers_receiver_bike_discount.weight_settings.map(el => renderRow(el.min_weight, el.max_weight, el.min_price, el.max_size || ''));
          return;
        }
      }

      renderRow();
    }

    $(document).on('input', '.wp-category-autocomplete', function () {
      const $input = $(this);
      const search = $input.val().toLowerCase();
      const $dropdown = $input.siblings('.wp-category-dropdown');
      const $hidden = $input.siblings('.wp-category-id');

      if (search.length === 0) {
        $hidden.val('');
        $dropdown.hide();
        return;
      }

      const ALL_CATEGORIES = lb_crawlers_receiver_bike_discount.all_site_categories || [];
      if (!ALL_CATEGORIES) return;

      if (search.length < 2) {
        $dropdown.hide();
        return;
      }

      // Filtra categorias pelo texto digitado
      const filtered = ALL_CATEGORIES.filter(cat => cat.name.toLowerCase().includes(search));
      if (filtered.length === 0) {
        $dropdown.hide();
        return;
      }

      // Monta o dropdown
      const dropdownHtml = filtered.map(cat =>
        `<div class="dropdown-item" data-id="${cat.id}" data-name="${cat.name}">${cat.name}</div>`
      ).join('');

      $dropdown.html(dropdownHtml).show();
    });

    // Quando clicar em um item do dropdown
    $(document).on('click', '.dropdown-item', function () {
      const $item = $(this);
      const $input = $item.parent().siblings('.wp-category-autocomplete');
      const $hidden = $item.parent().siblings('.wp-category-id');
      const root = $input.data('root');

      $input.val($item.data('name'));
      $hidden.val($item.data('id') + (root ? '|root' : ''));
      $item.parent().hide();
    });

    // Esconder dropdown quando clicar fora
    $(document).on('click', function (e) {
      if (!$(e.target).closest('.wp-category-autocomplete, .wp-category-dropdown').length) {
        $('.wp-category-dropdown').hide();
      }
    });

    // Navegação com teclado (opcional)
    $(document).on('keydown', '.wp-category-autocomplete', function (e) {
      const $input = $(this);
      const $dropdown = $input.siblings('.wp-category-dropdown');
      const $items = $dropdown.find('.dropdown-item');
      const $active = $dropdown.find('.dropdown-item.active');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if ($active.length === 0) {
          $items.first().addClass('active');
        } else {
          $active.removeClass('active').next().addClass('active');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if ($active.length === 0) {
          $items.last().addClass('active');
        } else {
          $active.removeClass('active').prev().addClass('active');
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if ($active.length > 0) {
          $active.click();
        }
      } else if (e.key === 'Escape') {
        $dropdown.hide();
      }
    });

    $(document).on('click', '#lb-bike-discount-new-line', renderRow);
    $(document).on('click', '.lb-weight-delete', deleteRow);

    const selectedCategories = lb_crawlers_receiver_bike_discount.selected_categories || [];
    const viewedCategories = lb_crawlers_receiver_bike_discount.viewed_categories || [];
    const overrideWeight = lb_crawlers_receiver_bike_discount.override_weight || [];
    const overrideCategories = lb_crawlers_receiver_bike_discount.override_categories || [];
    const categoriesWeight = lb_crawlers_receiver_bike_discount.categories_weight || {};
    const categoriesDimension = lb_crawlers_receiver_bike_discount.categories_dimension || {};

    const getCategoryWeight = (category) => {
      if (category && categoriesWeight[category]) return categoriesWeight[category];
      return '';
    }

    const getCategoryDimension = (category) => {
      if (category && categoriesDimension[category]) return categoriesDimension[category];
      return '';
    }

    const getOverrideCategoryId = (category) => {
      if (category && overrideCategories[category]) return overrideCategories[category];
      return '';
    }

    const getOverrideCategoryName = (category) => {
      const overrideCatId = getOverrideCategoryId(category).split('|')[0];
      let overrideCatName = '';
      if (overrideCatId && lb_crawlers_receiver_bike_discount.all_site_categories) {
        const cat = lb_crawlers_receiver_bike_discount.all_site_categories.find(c => String(c.id) === String(overrideCatId));
        if (cat) overrideCatName = cat.name;
      }
      return overrideCatName;
    }

    function renderOverrideCategory(value, root = false) {
      return `
        <label style="position:relative;color:black;margin: 0 10px 0 20px">
          <strong>Redirecionar Categoria: </strong><br/>
          <input type="text" class="wp-category-autocomplete" data-root="${root}" data-category-value="${value}" style="width: 150px" autocomplete="off" placeholder="Buscar categoria..." value="${getOverrideCategoryName(value)}">
          <input type="hidden" class="wp-category-id" name="wp_cat_id[${value}]" value="${getOverrideCategoryId(value)}">
          <div class="wp-category-dropdown" style="display:none;position:absolute;top:100%;left:0;width:150px;max-height:200px;overflow-y:auto;background:white;border:1px solid #ccc;border-radius:4px;z-index:1000;"></div>
        </label>    
      `;
    }

    function renderCategory(id, name, parent = '', value = '', title = true, hasChilds = true) {
      if (!value) value = id;

      // Determina se é categoria root (tem filhos)
      const isRootCategory = parent === '';

      const element = `
        <li>
          <label id="lb-bike-discount-item_${id}" class="lb-bike-discount-title">
            <input
              type="checkbox"
              name="sel_cat[]"
              value="${value}"
              ${value && selectedCategories.includes(value) ? 'checked' : ''}
              ${title ? `class="lb-bike-discount-title"` : ''}
            >${hasChilds ? name : `<a href="${value}" target="blank">${name}</a>`}

            ${isRootCategory ? `
              <div style="display:inline-flex;gap:5px;align-items:center;">
                ${renderOverrideCategory(value, true)}
              </div>` : ''}

            ${title && hasChilds ? `<button class="lb-bike-discount-toggle" type="button">Exibir/Ocultar</button>` : ''}
          </label>

          ${title && hasChilds ? `<ul class="lb-bike-discount-subitems"></ul>` : ''}

          ${!hasChilds ? `
          <div style="display:inline-flex;gap:5px;align-items:center;">
            <div><input type="checkbox" name="vw_cat[]" value="${value}" ${value && viewedCategories.includes(value) ? 'checked' : ''}></div>
            <label><strong>Peso (g): </strong><input type="number" name="lt_wei[${value}]" style="width: 70px" min="0" step="any" value="${getCategoryWeight(value)}"></label>
            <label><strong>Dimensão (cm): </strong><input type="number" name="lt_dim[${value}]" style="width: 70px" min="0" step="any" value="${getCategoryDimension(value)}"></label>
            <label><input type="checkbox" name="ow_cat[]" value="${value}" ${value && overrideWeight.includes(value) ? 'checked' : ''}> Usar Peso?</label>
            ${renderOverrideCategory(value)}
          </div>` : ''}
        </li>
      `;

      $(`#lb-bike-discount-available-categories ${parent}`).append(element);
    }

    const slugify = str =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    function renderAvailableCategories() {
      if (lb_crawlers_receiver_bike_discount && lb_crawlers_receiver_bike_discount.available_categories) {
        const categories = lb_crawlers_receiver_bike_discount.available_categories;

        const renderCategories = (items, parentSlug) => {
          items.map(item => {
            const slug = `${parentSlug}${!!parentSlug ? '-' : ''}${slugify(item.name)}`;
            const hasChilds = item.childs && item.childs.length > 0 ? true : false;
            const parent = !parentSlug ? '' : `#lb-bike-discount-item_${parentSlug} ~ .lb-bike-discount-subitems`;

            renderCategory(slug, item.name, parent, !hasChilds ? item.url : '', hasChilds, hasChilds);

            if (hasChilds) renderCategories(item.childs, slug);
          });
        };

        if (!categories.length) {
          $('#lb-bike-discount-save-categories').prop('disabled', true);
          return;
        }

        renderCategories(categories, '');

        $('.lb-bike-discount-subitems').slideToggle();
      } else {
        $('#lb-bike-discount-save-categories').prop('disabled', true);
      }
    }

    function selectAll() {
      $(this).parent().parent().find('.lb-bike-discount-subitems li label[id^="lb-bike-discount-item"] input').prop('checked', this.checked);
    }

    function toggle() {
      $(this).parent().parent().children('.lb-bike-discount-subitems').slideToggle();
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
      $('#lb-bike-discount-categories').prop('disabled', false);
      $('#lb-bike-discount-save-categories').prop('disabled', false);
      $('#lb-bike-discount-save-categories').html('Salvar');
    }

    function processSelectedCategories() {
      const $categories = getValues('input[name="sel_cat[]"]:checked');

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_bike_discount.ajaxurl,
        data: {
          categories: $categories,
          action: 'bikediscount_process_selected_categories',
          nonce: lb_crawlers_receiver_bike_discount.nonce
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
        url: lb_crawlers_receiver_bike_discount.ajaxurl,
        data: {
          viewed: $categories,
          action: 'bikediscount_process_viewed_categories',
          nonce: lb_crawlers_receiver_bike_discount.nonce
        },
        dataType: 'JSON',
        success: function () {
          processOverrideCategoriesWeight();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          handleError(errorThrown);
        }
      });
    }

    function processOverrideCategoriesWeight() {
      const $categories = getValues('input[name="ow_cat[]"]:checked');

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_bike_discount.ajaxurl,
        data: {
          overrides: $categories,
          action: 'bikediscount_process_override_weight_categories',
          nonce: lb_crawlers_receiver_bike_discount.nonce
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
        url: lb_crawlers_receiver_bike_discount.ajaxurl,
        data: {
          dimensions: $categories,
          action: 'bikediscount_process_categories_dimension',
          nonce: lb_crawlers_receiver_bike_discount.nonce
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
        url: lb_crawlers_receiver_bike_discount.ajaxurl,
        data: {
          weights: $categories,
          action: 'bikediscount_process_categories_weight',
          nonce: lb_crawlers_receiver_bike_discount.nonce
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
      const $categories = {};

      $('input[name^="wp_cat_id["]').each(function () {
        const name = $(this).attr('name');
        const value = $(this).val();

        const match = /\[([^[\]]+)\]/.exec(name);

        if (match && value) {
          const key = match[1];
          $categories[key] = value;
        }
      });

      $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_bike_discount.ajaxurl,
        data: {
          categories: $categories,
          action: 'bikediscount_process_override_categories',
          nonce: lb_crawlers_receiver_bike_discount.nonce
        },
        dataType: 'JSON',
        success: function () {
          // Após processar as categorias WP, recarrega a página
          location.reload();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          handleError(errorThrown);
        }
      });
    }

    $(document).on('change', '.lb-bike-discount-title', selectAll);
    $(document).on('click', '.lb-bike-discount-toggle', toggle);
    $(document).on('submit', '#lb-bike-discount-categories', function (e) {
      e.preventDefault();
      $('#lb-bike-discount-categories').prop('disabled', true);
      $('#lb-bike-discount-save-categories').html('Aguarde');
      $('#lb-bike-discount-save-categories').prop('disabled', true);
      processSelectedCategories();
    });

    renderTableData();
    renderAvailableCategories();
  });
})(jQuery);
