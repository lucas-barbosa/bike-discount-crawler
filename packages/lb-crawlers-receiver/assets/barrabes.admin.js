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

      const ALL_CATEGORIES = lb_crawlers_receiver_barrabes.all_site_categories || [];
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

    $(document).on('click', '#lb-barrabes-new-line', renderRow);
    $(document).on('click', '.lb-weight-delete', deleteRow);

    const selectedCategories = lb_crawlers_receiver_barrabes.selected_categories;
    const viewedCategories = lb_crawlers_receiver_barrabes.viewed_categories || [];
    const overrideWeight = lb_crawlers_receiver_barrabes.override_weight || [];
    const overrideCategories = lb_crawlers_receiver_barrabes.override_categories || [];
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

    const getOverrideCategoryId = (category) => {
      if (category && overrideCategories[category]) return overrideCategories[category];
      return '';
    }

    const getOverrideCategoryName = (category) => {
      const overrideCatId = getOverrideCategoryId(category).split('|')[0];
      let overrideCatName = '';
      if (overrideCatId && lb_crawlers_receiver_barrabes.all_site_categories) {
        const cat = lb_crawlers_receiver_barrabes.all_site_categories.find(c => String(c.id) === String(overrideCatId));
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

    function renderCategory(root, id, name, parent = '', value = '', isTitle = true, hasChilds = true) {
      if (!value) value = id;

      // Determina se é categoria root (tem filhos)
      const isRootCategory = parent === '';

      const element = `
          <li>
            <label id="lb-barrabes-item_${id}" class="lb-barrabes-title">
            <input
              type="checkbox"
              name="sel_cat[]"
              value="${value}"
              ${value && selectedCategories.includes(value) ? 'checked' : ''}
              ${isTitle ? `class="lb-barrabes-title"` : ''}
            >${hasChilds ? name : `<a href="${value}" target="blank">${name}</a>`}

            ${isRootCategory ? `
              <div style="display:inline-flex;gap:5px;align-items:center;">
                ${renderOverrideCategory(value, true)}
              </div>` : ''}

            ${isTitle && hasChilds ? `<button class="lb-barrabes-toggle" type="button">Exibir/Ocultar</button>` : ''}
            </label>

            ${isTitle && hasChilds ? `<ul class="lb-barrabes-subitems"></ul>` : ''}
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

      $(`${root} ${parent}`).append(element);
    }

    const slugify = str =>
      str
        .toLocaleLowerCase('pt-BR')              // minúsculas (com suporte a acentos)
        .trim()                                  // remove espaços extras
        .replace(/[^\p{L}\p{N}\s-]/gu, '')       // remove caracteres não permitidos (Unicode)
        .replace(/[\s_-]+/g, '-')                // substitui espaço/underscore repetido por "-"
        .replace(/^-+|-+$/g, '');                // remove "-" do início/fim

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
        url: lb_crawlers_receiver_barrabes.ajaxurl,
        data: {
          categories: $categories,
          action: 'barrabes_process_override_categories',
          nonce: lb_crawlers_receiver_barrabes.nonce
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
