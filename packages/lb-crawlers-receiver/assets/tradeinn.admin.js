(function ($) {
  'use strict';

  $(document).ready(() => {
    // Cache de seletores frequentemente usados
    const $document = $(document);
    const $availableCategories = $('#lb-tradeinn-available-categories');
    const $saveButton = $('#lb-tradeinn-save-categories');
    const $categoriesForm = $('#tradeinn-categories');

    // Estado em memória para evitar depender apenas do DOM
    const state = {
      categoryTree: {}, // Árvore completa de categorias
      renderedNodes: new Set(), // IDs já renderizados
      expandedNodes: new Set(), // Nodes expandidos
      selectedStates: {} // Estado de seleção (incluindo não renderizados)
    };

    // Templates para evitar concatenação repetida
    const templates = {
      tableRow: (min, max, price, maxSize) => `
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
          <td><button class="lb-weight-delete" type="button">Deletar</button></td>
        </tr>`,

      overrideCategory: (value, root, overrideName, overrideId) => `
        <label style="position:relative;color:black;margin: 0 10px 0 20px">
          <strong>Redirecionar Categoria: </strong><br/>
          <input type="text" class="wp-category-autocomplete" data-root="${root}" data-category-value="${value}" style="width: 150px" autocomplete="off" placeholder="Buscar categoria..." value="${overrideName}">
          <input type="hidden" class="wp-category-id" name="wp_cat_id[${value}]" value="${overrideId}">
          <div class="wp-category-dropdown" style="display:none;position:absolute;top:100%;left:0;width:150px;max-height:200px;overflow-y:auto;background:white;border:1px solid #ccc;border-radius:4px;z-index:1000;"></div>
        </label>`,

      weightDimensionInputs: (value, weight, dimension, isOverride, isViewed, overrideName, overrideId) => `
        <div style="display:inline-flex;gap:5px;align-items:center;">
          <div><input type="checkbox" name="vw_cat[]" value="${value}" ${isViewed ? 'checked' : ''}></div>
          <label><strong>Peso (g): </strong><input type="number" name="lt_wei[${value}]" style="width: 70px" min="0" step="any" value="${weight}"></label>
          <label><strong>Dimensão (cm): </strong><input type="number" name="lt_dim[${value}]" style="width: 70px" min="0" step="any" value="${dimension}"></label>
          <label><input type="checkbox" name="ow_cat[]" value="${value}" ${isOverride ? 'checked' : ''}> Usar Peso?</label>
          ${templates.overrideCategory(value, false, overrideName, overrideId)}
        </div>`,

      rootCategoryExtras: (value, overrideName, overrideId) => `
        <div style="display:inline-flex;gap:5px;align-items:center;">
          ${templates.overrideCategory(value, true, overrideName, overrideId)}
        </div>`,

      attributeValue: (composedValue, valueName, weight, dimension, isSelected, isViewed, isOverride, overrideName, overrideId) => `
        <li>
          <label>
            <input type="checkbox" name="sel_attr[]" value="${composedValue}" ${isSelected ? 'checked' : ''} data-attr-value="${composedValue}">
            <a href="${helpers.getAttributesUrl(composedValue)}" target="_blank">${valueName}</a>
            <div style="display:inline-flex;gap:5px;align-items:center;">
              <div><input type="checkbox" name="vw_attr[]" value="${composedValue}" ${isViewed ? 'checked' : ''}></div>
              <label><strong>Peso (g): </strong><input type="number" name="lt_wei[${composedValue}]" style="width:70px" min="0" step="any" value="${weight}"></label>
              <label><strong>Dimensão (cm): </strong><input type="number" name="lt_dim[${composedValue}]" style="width:70px" min="0" step="any" value="${dimension}"></label>
              <label><input type="checkbox" name="ow_attr[]" value="${composedValue}" ${isOverride ? 'checked' : ''}> Usar Peso?</label>
              ${templates.overrideCategory(composedValue, false, overrideName, overrideId)}
            </div>
          </label>
        </li>`
    };

    // Cache de dados
    const cachedData = {
      selectedCategories: lb_crawlers_receiver_tradeinn.selected_categories || [],
      viewedCategories: lb_crawlers_receiver_tradeinn.viewed_categories || [],
      overrideWeight: lb_crawlers_receiver_tradeinn.override_weight || [],
      categoriesWeight: lb_crawlers_receiver_tradeinn.categories_weight || {},
      categoriesDimension: lb_crawlers_receiver_tradeinn.categories_dimension || {},
      overrideCategories: lb_crawlers_receiver_tradeinn.override_categories || [],
      allCategories: lb_crawlers_receiver_tradeinn.all_site_categories || [],
      categoryAttributes: lb_crawlers_receiver_tradeinn.category_attributes || []
    };

    // Inicializa estados de seleção
    cachedData.selectedCategories.forEach(val => {
      state.selectedStates[val] = true;
    });

    // Funções auxiliares otimizadas
    const helpers = {
      getCategoryWeight: (category) => cachedData.categoriesWeight[category] || '',
      
      getCategoryDimension: (category) => cachedData.categoriesDimension[category] || '',
      
      getOverrideCategoryId: (category) => cachedData.overrideCategories[category] || '',
      
      getOverrideCategoryName: (category) => {
        const overrideCatId = helpers.getOverrideCategoryId(category).split('|')[0];
        if (!overrideCatId || !cachedData.allCategories.length) return '';
        
        const cat = cachedData.allCategories.find(c => String(c.id) === String(overrideCatId));
        return cat ? cat.name : '';
      },

      slugify: (str) => str
        .toLocaleLowerCase('pt-BR')
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, ''),

      // Coleta todos os descendentes de um nó (recursivo) - incluindo valores de atributos
      getAllDescendants: (nodeId) => {
        const descendants = [];
        const node = state.categoryTree[nodeId];
        
        if (!node) return descendants;
        
        // Adiciona o valor do próprio nó se existir
        if (node.value) {
          descendants.push(node.value);
        }
        
        // Adiciona valores de atributos se existir
        // if (node.attributeValues && node.attributeValues.length > 0) {
        //   descendants.push(...node.attributeValues);
        // }
        
        // Adiciona filhos recursivamente
        if (node.children && node.children.length > 0) {
          node.children.forEach(childId => {
            descendants.push(...helpers.getAllDescendants(childId));
          });
        }
        
        return descendants;
      },

      // Coleta valores de campos (DOM + memória)
      getValues: (fieldName) => {
        const values = [];
        $(fieldName).each(function() {
          const val = $(this).val();
          if (val && values.indexOf(val) === -1) {
            values.push(val);
          }
        });
        return values;
      },

      // Coleta TODOS os valores selecionados (incluindo não renderizados)
      getAllSelectedValues: (inputName) => {
        const selected = new Set();
        
        // Coleta do DOM (renderizados)
        $(`input[name="${inputName}"]:checked`).each(function() {
          selected.add($(this).val());
        });
        
        // Adiciona do estado em memória
        Object.keys(state.selectedStates).forEach(val => {
          if (state.selectedStates[val]) {
            selected.add(val);
          }
        });
        
        return Array.from(selected);
      },

      getAttributesUrl: (url) => {
        // Check if URL has categoryId parameter with three IDs separated by |
        const match = url.match(/categoryId=(\d+)\|(\d+)\|(\d+)/);
        
        if (!match) {
          return url; // Return original URL if pattern not found
        }
        
        const [, firstId, secondId, thirdId] = match;
        
        // Replace the URL format: keep first ID, replace the two last IDs with the new format
        const newUrl = url.replace(
          /categoryId=(\d+)\|(\d+)\|(\d+)/,
          `categoryId=$1#fq=id_familia=1&sort=v30_sum;desc@tm1;asc&fe=&pf=id_subfamilia=$1@atributos=${secondId}_${thirdId}_1&start=0`
        );
        
        return newUrl;
      }
    };

    // Funções de tabela
    function deleteRow() {
      $(this).closest('tr').remove();
    }

    function renderRow(min = '', max = '', price = '', maxSize = '') {
      $('#lb-tradeinn-weight-settings tbody').append(
        templates.tableRow(min, max, price, maxSize)
      );
    }

    function renderTableData() {
      const weightSettings = lb_crawlers_receiver_tradeinn?.weight_settings;
      if (weightSettings && weightSettings.length > 0) {
        weightSettings.forEach(el => 
          renderRow(el.min_weight, el.max_weight, el.min_price, el.max_size || '')
        );
      } else {
        renderRow();
      }
    }

    // Autocomplete de categorias
    $document.on('input', '.wp-category-autocomplete', function () {
      const $input = $(this);
      const search = $input.val().toLowerCase();
      const $dropdown = $input.siblings('.wp-category-dropdown');
      const $hidden = $input.siblings('.wp-category-id');

      if (search.length === 0) {
        $hidden.val('');
        $dropdown.hide();
        return;
      }

      if (!cachedData.allCategories.length || search.length < 2) {
        $dropdown.hide();
        return;
      }

      const filtered = cachedData.allCategories.filter(cat => 
        cat.name.toLowerCase().includes(search)
      );

      if (filtered.length === 0) {
        $dropdown.hide();
        return;
      }

      const dropdownHtml = filtered.map(cat =>
        `<div class="dropdown-item" data-id="${cat.id}" data-name="${cat.name}">${cat.name}</div>`
      ).join('');

      $dropdown.html(dropdownHtml).show();
    });

    $document.on('click', '.dropdown-item', function () {
      const $item = $(this);
      const $input = $item.parent().siblings('.wp-category-autocomplete');
      const $hidden = $item.parent().siblings('.wp-category-id');
      const root = $input.data('root');

      $input.val($item.data('name'));
      $hidden.val($item.data('id') + (root ? '|root' : ''));
      $item.parent().hide();
    });

    $document.on('click', function (e) {
      if (!$(e.target).closest('.wp-category-autocomplete, .wp-category-dropdown').length) {
        $('.wp-category-dropdown').hide();
      }
    });

    $document.on('keydown', '.wp-category-autocomplete', function (e) {
      const $input = $(this);
      const $dropdown = $input.siblings('.wp-category-dropdown');
      const $items = $dropdown.find('.dropdown-item');
      const $active = $dropdown.find('.dropdown-item.active');

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if ($active.length === 0) {
            $items.first().addClass('active');
          } else {
            $active.removeClass('active').next().addClass('active');
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if ($active.length === 0) {
            $items.last().addClass('active');
          } else {
            $active.removeClass('active').prev().addClass('active');
          }
          break;
        case 'Enter':
          e.preventDefault();
          if ($active.length > 0) $active.click();
          break;
        case 'Escape':
          $dropdown.hide();
          break;
      }
    });

    // Renderização de atributos
    function renderAttributes(attributes, categoryValue, $parentLi, nodeId) {
      if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
        return;
      }

      const $attrContainer = $parentLi.find('ul.lb-tradeinn-attributes');
      const attributeValues = [];

      attributes.forEach(attr => {
        const attrLabel = attr.label;
        const attrValues = attr.values || [];

        const $attrBlock = $(`
          <li>
            <label class="lb-tradeinn-title">
              <strong>${attrLabel}</strong>
            </label>
            <ul class="lb-tradeinn-attribute-values"></ul>
          </li>
        `);

        const $attrValuesContainer = $attrBlock.find('.lb-tradeinn-attribute-values');
        
        const valuesHtml = attrValues.map(val => {
          const composedValue = `${categoryValue}|${attr.id}|${val.id}`;
          attributeValues.push(composedValue); // Armazena para o estado
          
          const weight = helpers.getCategoryWeight(composedValue);
          const dimension = helpers.getCategoryDimension(composedValue);
          const isSelected = cachedData.selectedCategories.includes(composedValue);
          const isViewed = cachedData.viewedCategories.includes(composedValue);
          const isOverride = cachedData.overrideWeight.includes(composedValue);
          const overrideName = helpers.getOverrideCategoryName(composedValue);
          const overrideId = helpers.getOverrideCategoryId(composedValue);

          return templates.attributeValue(
            composedValue, val.name, weight, dimension, 
            isSelected, isViewed, isOverride, overrideName, overrideId
          );
        }).join('');

        $attrValuesContainer.append(valuesHtml);
        $attrContainer.append($attrBlock);
      });

      // Armazena valores de atributos no state
      if (state.categoryTree[nodeId]) {
        state.categoryTree[nodeId].attributeValues = attributeValues;
      }
    }

    // Renderização de categorias com lazy loading
    function renderCategory(id, name, parent, value, title, hasChilds, childrenData) {
      if (!value) value = id;

      // Marca como renderizado
      state.renderedNodes.add(id);

      // Verifica se categoria tem atributos
      const attributes = !hasChilds && cachedData.categoryAttributes?.find(x => x.url === value);
      const hasAttributes = !!attributes && attributes?.attributes?.length > 0;

      // Armazena na árvore
      if (!state.categoryTree[id]) {
        state.categoryTree[id] = {
          id,
          name,
          value,
          hasChilds,
          hasAttributes,
          children: [],
          childrenData: childrenData || null,
          attributeValues: [],
          parent: parent ? parent.replace('#lb-tradeinn-item_', '').replace(' ~ .lb-tradeinn-subitems', '') : null
        };
      }
      
      const isRootCategory = parent === '';
      const overrideName = helpers.getOverrideCategoryName(value);
      const overrideId = helpers.getOverrideCategoryId(value);
      const weight = helpers.getCategoryWeight(value);
      const dimension = helpers.getCategoryDimension(value);
      const isSelected = cachedData.selectedCategories.includes(value) || state.selectedStates[value];
      const isViewed = cachedData.viewedCategories.includes(value);
      const isOverride = cachedData.overrideWeight.includes(value);

      // Determina se é título (tem filhos OU tem atributos)
      const isTitle = Boolean(hasChilds || hasAttributes);

      const categoryLink = hasChilds 
        ? name 
        : `<a href="${value}" target="_blank">${name}</a>`;

      const checkboxClass = isTitle ? ' class="lb-tradeinn-title"' : '';
      const checkedAttr = value && isSelected ? ' checked' : '';

      const toggleButton = isTitle && hasChilds
        ? `<button class="lb-tradeinn-toggle" type="button" data-node-id="${id}">Exibir/Ocultar</button>` 
        : '';

      const rootExtras = isRootCategory 
        ? templates.rootCategoryExtras(value, overrideName, overrideId)
        : '';

      const leafExtras = !hasChilds
        ? templates.weightDimensionInputs(value, weight, dimension, isOverride, isViewed, overrideName, overrideId)
        : '';

      const subitemsList = isTitle && hasChilds
        ? `<ul class="lb-tradeinn-subitems" data-node-id="${id}" style="display:none;"></ul>` 
        : '';

      const attributesList = hasAttributes
        ? `<ul class="lb-tradeinn-attributes"></ul>`
        : '';

      const element = `
        <li data-node-id="${id}">
          <label id="lb-tradeinn-item_${id}" class="lb-tradeinn-title">
            <input type="checkbox" name="sel_cat[]" value="${value}"${checkboxClass}${checkedAttr} data-node-id="${id}">
            ${categoryLink}
            ${rootExtras}
            ${toggleButton}
          </label>
          ${subitemsList}
          ${leafExtras}
          ${attributesList}
        </li>
      `;

      const $parent = parent ? $(`${parent}`) : $availableCategories;
      $parent.append(element);

      // Renderiza atributos se houver
      if (hasAttributes) {
        const $parentLi = $(`#lb-tradeinn-item_${id}`).closest('li');
        renderAttributes(attributes.attributes, value, $parentLi, id);
      }
    }

    // Renderiza filhos de um nó específico (lazy loading)
    function renderChildren(nodeId) {
      const node = state.categoryTree[nodeId];
      if (!node || !node.childrenData) return;

      const parentSlug = nodeId;

      node.childrenData.forEach(item => {
        const slug = `${parentSlug}-${helpers.slugify(item.name)}`;
        const hasChilds = item.childs && item.childs.length > 0;
        const itemValue = !hasChilds ? item.url : '';
        const parent = `#lb-tradeinn-item_${parentSlug} ~ .lb-tradeinn-subitems`;

        // Adiciona à lista de filhos do pai
        node.children.push(slug);

        renderCategory(slug, item.name, parent, itemValue, hasChilds, hasChilds, item.childs);
      });
    }

    function renderAvailableCategories() {
      const categories = lb_crawlers_receiver_tradeinn?.available_categories;
      
      if (!categories || !categories.length) {
        $saveButton.prop('disabled', true);
        return;
      }

      // Renderiza APENAS as categorias raiz inicialmente
      categories.forEach(item => {
        const slug = helpers.slugify(item.name);
        const hasChilds = item.childs && item.childs.length > 0;
        
        renderCategory(slug, item.name, '', '', hasChilds, hasChilds, item.childs);
      });
    }

    // Event handlers
    function selectAll() {
      const $checkbox = $(this);
      const nodeId = $checkbox.data('node-id');
      const isChecked = $checkbox.prop('checked');
      const value = $checkbox.val();
      
      // Atualiza estado em memória
      if (value) {
        state.selectedStates[value] = isChecked;
      }
      
      // Coleta TODOS os descendentes (valores de categorias e atributos)
      const descendants = helpers.getAllDescendants(nodeId);
      
      // Atualiza estado em memória para todos descendentes
      descendants.forEach(descValue => {
        state.selectedStates[descValue] = isChecked;
      });
      
      // Atualiza checkboxes renderizados (DOM)
      descendants.forEach(descValue => {
        // Checkboxes de categorias
        $(`input[type="checkbox"][name="sel_cat[]"][value="${descValue}"]`).prop('checked', isChecked);
        // Checkboxes de atributos
        // $(`input[type="checkbox"][name="sel_attr[]"][value="${descValue}"]`).prop('checked', isChecked);
      });
    }

    // Sincroniza estado individual ao mudar checkbox
    $document.on('change', 'input[name="sel_cat[]"], input[name="sel_attr[]"]', function() {
      const value = $(this).val();
      const isChecked = $(this).prop('checked');
      state.selectedStates[value] = isChecked;
    });

    function toggle() {
      const nodeId = $(this).data('node-id');
      const $subitems = $(`ul.lb-tradeinn-subitems[data-node-id="${nodeId}"]`);
      
      // Se ainda não foi expandido, renderiza os filhos agora (lazy loading)
      if (!state.expandedNodes.has(nodeId)) {
        renderChildren(nodeId);
        state.expandedNodes.add(nodeId);
      }
      
      // Toggle visibilidade
      if ($subitems.is(':visible')) {
        $subitems.hide();
      } else {
        $subitems.show();
      }
    }

    function handleError(errorMessage) {
      alert('Erro: ' + errorMessage);
      $categoriesForm.prop('disabled', false);
      $saveButton.prop('disabled', false).html('Salvar');
    }

    // AJAX chain otimizado
    const ajaxRequest = (action, data) => {
      return $.ajax({
        type: 'POST',
        url: lb_crawlers_receiver_tradeinn.ajaxurl,
        data: {
          ...data,
          action,
          nonce: lb_crawlers_receiver_tradeinn.nonce
        },
        dataType: 'JSON'
      });
    };

    function processSelectedCategories() {
      const categories = helpers.getAllSelectedValues('sel_cat[]');
      const attributes = helpers.getAllSelectedValues('sel_attr[]');
      const allSelected = [...categories, ...attributes];
      
      ajaxRequest('tradeinn_process_selected_categories', { categories: allSelected })
        .then(() => processViewedCategories())
        .catch((jqXHR, textStatus, errorThrown) => handleError(errorThrown));
    }

    function processViewedCategories() {
      const viewed = helpers.getValues('input[name="vw_cat[]"]:checked');
      const viewedAttrs = helpers.getValues('input[name="vw_attr[]"]:checked');
      const allViewed = [...viewed, ...viewedAttrs];
      
      ajaxRequest('tradeinn_process_viewed_categories', { viewed: allViewed })
        .then(() => processOverrideCategoriesWeight())
        .catch((jqXHR, textStatus, errorThrown) => handleError(errorThrown));
    }

    function processOverrideCategoriesWeight() {
      const overrides = helpers.getValues('input[name="ow_cat[]"]:checked');
      const overridesAttrs = helpers.getValues('input[name="ow_attr[]"]:checked');
      const allOverrides = [...overrides, ...overridesAttrs];
      
      ajaxRequest('tradeinn_process_override_weight_categories', { overrides: allOverrides })
        .then(() => processCategoriesDimension())
        .catch((jqXHR, textStatus, errorThrown) => handleError(errorThrown));
    }

    function processCategoriesDimension() {
      const dimensions = {};
      $('input[name^="lt_dim["]').each(function () {
        const match = /\[([^[\]]+)\]/.exec($(this).attr('name'));
        const value = $(this).val();
        if (match && value) dimensions[match[1]] = value;
      });

      ajaxRequest('tradeinn_process_categories_dimension', { dimensions })
        .then(() => processCategoriesWeight())
        .catch((jqXHR, textStatus, errorThrown) => handleError(errorThrown));
    }

    function processCategoriesWeight() {
      const weights = {};
      $('input[name^="lt_wei["]').each(function () {
        const match = /\[([^[\]]+)\]/.exec($(this).attr('name'));
        const value = $(this).val();
        if (match && value) weights[match[1]] = value;
      });

      ajaxRequest('tradeinn_process_categories_weight', { weights })
        .then(() => processOverrideCategories())
        .catch((jqXHR, textStatus, errorThrown) => handleError(errorThrown));
    }

    function processOverrideCategories() {
      const categories = {};
      $('input[name^="wp_cat_id["]').each(function () {
        const match = /\[([^[\]]+)\]/.exec($(this).attr('name'));
        const value = $(this).val();
        if (match && value) categories[match[1]] = value;
      });

      ajaxRequest('tradeinn_process_override_categories', { categories })
        .then(() => location.reload())
        .catch((jqXHR, textStatus, errorThrown) => handleError(errorThrown));
    }

    // Event listeners
    $document.on('click', '#lb-tradeinn-new-line', () => renderRow());
    $document.on('click', '.lb-weight-delete', deleteRow);
    $document.on('change', '.lb-tradeinn-title', selectAll);
    $document.on('click', '.lb-tradeinn-toggle', toggle);
    
    $document.on('submit', '#tradeinn-categories', function (e) {
      e.preventDefault();
      $categoriesForm.prop('disabled', true);
      $saveButton.html('Aguarde').prop('disabled', true);
      processSelectedCategories();
    });

    // Inicialização
    renderTableData();
    renderAvailableCategories();
  });
})(jQuery);
