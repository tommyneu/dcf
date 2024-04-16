import { DCFUtility } from './dcf-utility';

/**
 * @typedef {Object} ParsedOption
 * @property {'option'} tag - The option's tag
 * @property {string} label - The option's label
 * @property {string} value - The option's value
 * @property {string} id - The option's unique ID
 * @property {HTMLOptionElement} element - The options's original element
 */

/**
 * @typedef {Object} ParsedOptgroup
 * @property {'optgroup'} tag - The optgroup tag
 * @property {string} label - The optgroup's label
 * @property {HTMLOptGroupElement|HTMLSelectElement} element - The optgroup's original element
 * @property {Array<ParsedOption>} items - The optgroup's children
 */

/**
 * @typedef {Object} ParseSelectInner
 * @property {Array<ParsedOptgroup>} optgroups - A list of optgroups found
 * @property {Array<ParsedOption>} options - A list of options found
 */

export class DCFSearchSelectTheme {
  // Sets up the theme
  constructor() {
    this.availableItemsClassList = [
      'dcf-m-0',
      'dcf-b-1',
      'dcf-b-solid',
    ];
  }

  // Allows us to set the theme variables if they are defined and we match the types
  setThemeVariable(themeVariableName, value) {
    if (themeVariableName in this && typeof value == typeof this[themeVariableName]) {
      this[themeVariableName] = value;
    }
  }
}

class DCFSearchSelectClass {
  constructor(selectElement) {
    this.selectElement = selectElement;
    this.labelElement = document.querySelector(`label[for=${ this.selectElement.getAttribute('id') }]`);

    this.uuid = DCFUtility.uuidv4();

    this.selectID = this.selectElement.getAttribute('id') || this.uuid.concat('-search-and-select-select');
    this.labelID = this.labelElement.getAttribute('id') || this.uuid.concat('-search-and-select-label');
    this.searchAndSelectID = this.uuid.concat('-search-and-select');
    this.inputID = this.uuid.concat('-search-and-select-input');
    this.availableItemsListID = this.uuid.concat('-search-and-select-available-items-list');
    this.selectedItemsListID = this.uuid.concat('-search-and-select-selected-items-list');
    this.selectedItemsHelpID = this.uuid.concat('-search-and-select-selected-items-list-help');

    this.labelElement.setAttribute('id', this.labelID);
    this.labelElement.setAttribute('for', this.inputID);

    this.parsedSelect = this.parseSelect();
    this.availableItemsListElement = this.buildAvailableItems();

    this.availableItemsListElement.setAttribute('id', this.availableItemsListID);
    this.availableItemsListElement.setAttribute('aria-labelledby', this.labelID);
    this.availableItemsListElement.setAttribute('aria-multiselectable', true);
    this.availableItemsListElement.classList.add(
      'dcf-search-and-select-available-items',
      'dcf-w-100%',
      'dcf-absolute',
      'dcf-d-none',
      'dcf-z-1',
      'dcf-p-0',
      'dcf-m-0'
    );

    this.searchAndSelectElement = document.createElement('div');
    this.searchAndSelectElement.innerHTML = `
      <div
        class="
          dcf-search-and-select-search-area
          dcf-relative
          dcf-d-grid
          dcf-overflow-x-hidden
          dcf-overflow-y-auto
        "
      >
        <span id="${ this.selectedItemsHelpID }" class="dcf-sr-only">Press Delete or Backspace to Remove.</span>
        <ul
          class="dcf-search-and-select-selected-items dcf-d-flex dcf-flex-wrap dcf-gap-3 dcf-m-0 dcf-p-3"
          role="listbox"
          aria-describedby="${ this.selectedItemsHelpID }"
          id=${ this.selectedItemsListID }
          tabindex="-1"
          aria-activedescendant=""
          aria-orientation="horizontal"
        ></ul>
        <div class="dcf-search-and-select-open-btn dcf-sticky dcf-top-50% dcf-h-0 dcf-pl-1 dcf-pr-1">
          <button
            class="dcf-btn dcf-btn-tertiary dcf-m-0 dcf-p-3"
            type="button"
            tabindex="-1"
            aria-expanded="false"
            aria-controls="${ this.availableItemsListID }"
            aria-labelledby="${ this.labelID }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              class="dcf-fill-current dcf-w-3 dcf-h-3 dcf-d-block"
              aria-hidden="true"
            >
              <path d="M23.936,2.255C23.848,2.098,23.681,2,23.5,2h-23
                C0.32,2,0.153,2.098,0.065,2.255c-0.089,0.157-0.085,0.35,0.008,0.504
                l11.5,19C11.663,21.908,11.826,22,12,22s0.337-0.092,0.428-0.241
                l11.5-19C24.021,2.605,24.025,2.412,23.936,2.255z"></path>
            </svg>
          </button>
        </div>
        <input
          class="dcf-m-2 dcf-b-0"
          type="text"
          role="combobox"
          id=${ this.inputID }
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-expanded="false"
          aria-controls="${ this.availableItemsListID }"
        >
      </div>
    `;
    this.searchAndSelectElement.append(this.availableItemsListElement);
    this.searchAndSelectElement.classList.add('dcf-search-and-select', 'dcf-relative');
    this.searchAndSelectElement.setAttribute('id', this.searchAndSelectID);
    this.searchAndSelectElement.dataset.for = this.selectID;
    selectElement.after(this.searchAndSelectElement);

    this.inputElement = this.searchAndSelectElement.querySelector('input');
    this.selectedItemsListElement = this.searchAndSelectElement.querySelector('.dcf-search-and-select-selected-items');
    this.openButtonElement = this.searchAndSelectElement.querySelector('.dcf-search-and-select-open-btn button');
    this.searchAreaElement = this.searchAndSelectElement.querySelector('.dcf-search-and-select-search-area');

    this.currentFocus = null;
    this.listOfAvailableItems = [];

    this.addEventListeners();
  }

  /**
   * Recursively parses the select/optgroups
   * @returns { Array<ParsedOptgroup> }
   */
  parseSelect() {
    let returnedData = this.parseSelectInner(this.selectElement);
    let optgroups = returnedData.optgroups;

    optgroups.push({
      tag: 'optgroup',
      label: 'Other',
      element: this.selectElement,
      items: returnedData.options,
    });

    return optgroups;
  }

  /**
   * Recursively parses the select/optgroups
   * @param { HTMLSelectElement|HTMLOptGroupElement } selectOrOptgroup The select or optgroup to parse
   * @returns { ParseSelectInner }
   */
  parseSelectInner(selectOrOptgroup) {
    const optgroups = [];
    const options = [];

    for (const optgroupOrOption of selectOrOptgroup.children) {
      if (optgroupOrOption.tagName === 'OPTGROUP') {
        let returnedData = this.parseSelectInner(optgroupOrOption);
        let returnedOptgroups = returnedData.optgroups;
        optgroups.push(...returnedOptgroups);

        optgroups.push({
          tag: 'optgroup',
          label: optgroupOrOption.getAttribute('label'),
          element: optgroupOrOption,
          items: returnedData.options,
        });
      } else if (optgroupOrOption.tagName === 'OPTION') {
        options.push({
          tag: 'option',
          label: optgroupOrOption.innerHTML,
          value: optgroupOrOption.getAttribute('value'),
          id: DCFUtility.uuidv4().concat('-search-and-select-option'),
          element: optgroupOrOption,
        });
      }
    }

    return { optgroups: optgroups, options: options };
  }

  /**
   * Recursively builds the available items UL from output of parse select
   * @returns { HTMLUListElement }
   */
  buildAvailableItems() {
    let availableItems = document.createElement('ul');
    availableItems.setAttribute('role', 'listbox');

    this.parsedSelect.forEach((singleOptgroup) => {
      let groupedItems = document.createElement('ul');
      groupedItems.setAttribute('role', 'group');
      groupedItems.classList.add('dcf-search-and-select-item-group', 'dcf-m-0', 'dcf-p-0');

      if (this.parsedSelect.length !== DCFUtility.magicNumbers('int1')) {
        groupedItems.innerHTML = `
        ${ groupedItems.innerHTML }
        <li
          class="
            dcf-m-0
            dcf-bold
          "
          role="presentation"
        >
          ${ singleOptgroup.label }
        </li>
      `;
      }

      singleOptgroup.items.forEach((singleItem) => {
        groupedItems.innerHTML = `
          ${ groupedItems.innerHTML }
          <li
            class="
              dcf-search-and-select-item
              dcf-search-and-select-clickable
              dcf-relative
              dcf-d-flex
              dcf-flex-row
              dcf-flex-nowrap
              dcf-jc-between
              dcf-ai-center
              dcf-m-0
            "
            role="option"
            aria-selected="false"
            aria-disabled="false"
            data-value="${ singleItem.value }"
            data-id="${ singleItem.id }"
            id="${ `${ singleItem.id }-available` }"
          >
            <span class="dcf-search-and-select-item-label">${ singleItem.label}</span>
            <span class="dcf-search-and-select-item-indicator" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="dcf-fill-current dcf-h-4 dcf-w-4 dcf-d-block">
                <path d="M31,0.4C30.6,0.1,30-0.1,29.4,0c-0.6,0.1-1.1,0.4-1.5,0.9
                L10.1,26.3L3.8,20c-0.4-0.4-1-0.6-1.6-0.6c0,0,0,0,0,0
                c-0.6,0-1.2,0.2-1.6,0.6C0.2,20.5,0,21,0,21.6
                c0,0.6,0.2,1.2,0.7,1.6l8.1,8.1c0.4,0.4,1,0.7,1.6,0.7
                c0.7,0,1.4-0.4,1.8-1L31.6,3.5
                C32.3,2.5,32.1,1.1,31,0.4z"/>
              </svg>
            </span>
          </li>
        `;
      });

      availableItems.append(groupedItems);
    });

    return availableItems;
  }

  appendNewSelectedItem(singleAvailableItem) {
    let newSelectedItem = document.createElement('li');
    newSelectedItem.dataset.id = singleAvailableItem.dataset.id;
    newSelectedItem.setAttribute('id', `${ singleAvailableItem.dataset.id }-selected`);
    newSelectedItem.classList.add(
      'dcf-search-and-select-selected-item',
      'dcf-d-flex',
      'dcf-flex-nowrap',
      'dcf-m-0',
      'dcf-ai-center',
      'dcf-jc-center',
      'dcf-rounded',
      'dcf-search-and-select-clickable'
    );
    newSelectedItem.innerHTML = `
      <button
        class="
          dcf-search-and-select-selected-item-remove-btn
          dcf-btn
          dcf-btn-secondary
          dcf-m-0
          dcf-p-1
          dcf-h-100%
          dcf-sharp
          dcf-rounded-left
        "
        type="button"
        tabindex="-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" class="dcf-fill-current dcf-w-4 dcf-h-4 dcf-d-block">
          <path d="M25.4,22.6L15.8,13l9.6-9.6C25.8,3,26,2.5,26,2s-0.2-1-0.6-1.4c-0.8-0.8-2.1-0.8-2.8,0L13,10.2L3.4,0.6
            c-0.8-0.8-2-0.8-2.8,0c-0.8,0.8-0.8,2,0,2.8l9.6,9.6l-9.6,9.6C0.2,23,0,23.5,0,24c0,0.5,0.2,1,0.6,1.4C1,25.8,1.5,26,2,26
            c0.5,0,1-0.2,1.4-0.6l9.6-9.6l9.6,9.6C23,25.8,23.5,26,24,26c0,0,0,0,0,0c0.5,0,1-0.2,1.4-0.6C25.8,25,26,24.5,26,24
            C26,23.5,25.8,23,25.4,22.6z"/>
        </svg>
      </button>
      <span class="dcf-rounded-right dcf-b-1 dcf-b-solid dcf-p-1">
        ${ singleAvailableItem.querySelector('.dcf-search-and-select-item-label').innerText }
      </span>
    `;
    this.selectedItemsListElement.append(newSelectedItem);
    if (!this.isSelectedItemInView(newSelectedItem)) {
      newSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Add event listeners for the different parts of the search and select element
   */
  addEventListeners() {
    document.body.addEventListener('pointerup', (event) => {
      if (!this.searchAndSelectElement.contains(event.target)) {
        this.closeAvailableItems();
        this.setVisualFocusOn(false);
      }
    }, true);

    this.searchAreaElement.addEventListener('click', () => {
      this.setVisualFocusOn(this.searchAreaElement);
      this.inputElement.focus();
      if (this.isAvailableItemsOpen()) {
        this.closeAvailableItems();
      } else {
        this.filterAvailableItems();
        this.openAvailableItems();
      }
    });

    this.inputElement.addEventListener('focus', () => {
      this.setVisualFocusOn(this.searchAreaElement);
    });

    this.inputElement.addEventListener('blur', () => {
      this.setVisualFocusOn(false);
    });

    this.inputElement.addEventListener('keydown', (event) => {
      const altKey = event.altKey;
      let preventDefault = false;
      const length = this.inputElement.value.length;

      switch (event.code) {
      case 'Enter':
        if (this.visualFocusOnAvailableItems()) {
          const currentItemElement = this.getAvailableItemActiveDescendant();
          if (currentItemElement !== false) {
            if (this.isAvailableItemSelected(currentItemElement)) {
              this.removeAvailableItem(currentItemElement);
            } else {
              this.selectAvailableItem(currentItemElement);
            }
          }
        } else {
          if (!this.isAvailableItemsOpen()) {
            this.filterAvailableItems();
            this.openAvailableItems();
          }
          this.setVisualFocusOn(this.availableItemsListElement);
          this.setAvailableItemActiveDescendant(this.getFirstAvailableItem());
          this.scrollActiveAvailableItemInView();
        }
        preventDefault = true;
        break;

      case 'Down':
      case 'ArrowDown':
        if (altKey) {
          if (!this.isAvailableItemsOpen()) {
            this.filterAvailableItems();
            this.openAvailableItems();
          }
        } else {
          if (!this.isAvailableItemsOpen()) {
            this.filterAvailableItems();
            this.openAvailableItems();
          }
          if (!this.visualFocusOnAvailableItems()) {
            this.setVisualFocusOn(this.availableItemsListElement);
            this.setAvailableItemActiveDescendant(this.getFirstAvailableItem());
            this.scrollActiveAvailableItemInView();
          } else {
            this.setVisualFocusOn(this.availableItemsListElement);
            this.setAvailableItemActiveDescendant(this.getNextAvailableItem());
            this.scrollActiveAvailableItemInView();
          }
        }
        preventDefault = true;
        break;

      case 'Esc':
      case 'Escape':
        if (this.isAvailableItemsOpen()) {
          this.closeAvailableItems(true);
          this.setVisualFocusOn(this.searchAreaElement);
        }
        preventDefault = true;
        break;

      case 'Up':
      case 'ArrowUp':
        if (altKey) {
          if (!this.isAvailableItemsOpen()) {
            this.filterAvailableItems();
            this.openAvailableItems();
          }
        } else {
          if (!this.isAvailableItemsOpen()) {
            this.filterAvailableItems();
            this.openAvailableItems();
          }
          if (!this.visualFocusOnAvailableItems()) {
            this.setVisualFocusOn(this.availableItemsListElement);
            this.setAvailableItemActiveDescendant(this.getLastAvailableItem());
            this.scrollActiveAvailableItemInView();
          } else {
            this.setVisualFocusOn(this.availableItemsListElement);
            this.setAvailableItemActiveDescendant(this.getPreviousAvailableItem());
            this.scrollActiveAvailableItemInView();
          }
        }
        preventDefault = true;
        break;

      case 'Tab':
        this.closeAvailableItems(true);
        break;

      case 'Home':
        this.inputElement.setSelectionRange(DCFUtility.magicNumbers('int0'), DCFUtility.magicNumbers('int0'));
        preventDefault = true;
        break;

      case 'End':
        this.inputElement.setSelectionRange(length, length);
        preventDefault = true;
        break;

      default:
        break;
      }

      if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
    });

    this.inputElement.addEventListener('keyup', (event) => {
      const char = event.key;
      // const altKey = event.altKey;
      let preventDefault = false;
      // const length = this.inputElement.value.length;

      if (event.key === 'Escape' || event.key === 'Esc') {
        return;
      }

      switch (event.code) {
      case 'Backspace':
        this.setVisualFocusOn(this.searchAreaElement);
        this.filterAvailableItems();
        this.setAvailableItemActiveDescendant(false);
        preventDefault = true;
        break;

      case 'Left':
      case 'ArrowLeft':
      case 'Right':
      case 'ArrowRight':
      case 'Home':
      case 'End':
        this.setVisualFocusOn(this.searchAreaElement);
        preventDefault = true;
        break;

      default:
        if (this.isPrintableCharacter(char)) {
          this.setVisualFocusOn(this.searchAreaElement);
          this.filterAvailableItems();
          this.openAvailableItems();
          this.setAvailableItemActiveDescendant(false);
        }
        break;
      }

      if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
    });

    this.availableItemsListElement.addEventListener('click', (event) => {
      const closestItem = event.target.closest('.dcf-search-and-select-item');
      if (closestItem === null) {
        return;
      }

      if (this.isAvailableItemSelected(closestItem)) {
        this.removeAvailableItem(closestItem);
      } else {
        this.selectAvailableItem(closestItem);
      }
      this.inputElement.focus();
      this.setVisualFocusOn(this.availableItemsListElement);
      this.setAvailableItemActiveDescendant(closestItem);
    });

    this.availableItemsListElement.addEventListener('pointermove', (event) => {
      const currentItem = this.getAvailableItemActiveDescendant();
      const closestItem = event.target.closest('.dcf-search-and-select-item');
      if (closestItem === null) {
        return;
      }

      if (currentItem === false || !closestItem.isSameNode(currentItem)) {
        this.setAvailableItemActiveDescendant(closestItem);
      }
    });

    this.availableItemsListElement.addEventListener('pointerout', (event) => {
      if (this.availableItemsListElement.isSameNode(event.target)) {
        this.setAvailableItemActiveDescendant(false);
      }
    });

    this.selectedItemsListElement.addEventListener('click', (event) => {
      const closestSelectedItem = event.target.closest('.dcf-search-and-select-selected-item');
      if (closestSelectedItem === null) {
        return;
      }

      const closestDeleteButton = event.target.closest('.dcf-search-and-select-selected-item-remove-btn');
      if (closestDeleteButton !== null) {
        this.selectedItemsListElement.focus();
        this.removeSelectedItem(closestSelectedItem);
        this.setAvailableItemActiveDescendant(false);
        event.stopPropagation();
        return;
      }

      this.setVisualFocusOn(this.selectedItemsListElement);
      this.setAvailableItemActiveDescendant(false);
      this.setSelectedItemActiveDescendant(closestSelectedItem);
      event.stopPropagation();
    });

    this.selectedItemsListElement.addEventListener('pointermove', (event) => {
      const currentItem = this.getSelectedItemActiveDescendant();
      const closestSelectedItem = event.target.closest('.dcf-search-and-select-selected-item');
      if (closestSelectedItem === null) {
        return;
      }

      if (currentItem === false || !closestSelectedItem.isSameNode(currentItem)) {
        this.setSelectedItemActiveDescendant(closestSelectedItem);
      }
      event.stopPropagation();
    });

    this.selectedItemsListElement.addEventListener('pointerout', (event) => {
      if (this.selectedItemsListElement.isSameNode(event.target)) {
        this.setSelectedItemActiveDescendant(false);
        event.stopPropagation();
      }
    });

    this.selectedItemsListElement.addEventListener('focus', () => {
      this.setVisualFocusOn(this.selectedItemsListElement);
    });

    this.selectedItemsListElement.addEventListener('blur', () => {
      this.setVisualFocusOn(false);
      this.setSelectedItemActiveDescendant(false);
    });

    this.selectedItemsListElement.addEventListener('keydown', (event) => {
      let preventDefault = false;
      const currentItem = this.getSelectedItemActiveDescendant();
      const firstItem = this.getFirstSelectedItem();

      switch (event.code) {
      case 'Left':
      case 'ArrowLeft':
        if (currentItem === false) {
          this.setSelectedItemActiveDescendant(this.getLastSelectedItem());
        }
        this.setVisualFocusOn(this.selectedItemsListElement);
        this.setSelectedItemActiveDescendant(this.getPreviousSelectedItem());
        this.scrollActiveSelectedItemInView();
        preventDefault = true;
        break;

      case 'Right':
      case 'ArrowRight':
        if (currentItem === false) {
          this.setSelectedItemActiveDescendant(this.getFirstSelectedItem());
        }
        this.setVisualFocusOn(this.selectedItemsListElement);
        this.setSelectedItemActiveDescendant(this.getNextSelectedItem());
        this.scrollActiveSelectedItemInView();
        preventDefault = true;
        break;

      case 'Home':
        this.setVisualFocusOn(this.selectedItemsListElement);
        this.setSelectedItemActiveDescendant(this.getFirstSelectedItem());
        this.scrollActiveSelectedItemInView();
        preventDefault = true;
        break;

      case 'End':
        this.setVisualFocusOn(this.selectedItemsListElement);
        this.setSelectedItemActiveDescendant(this.getLastSelectedItem());
        this.scrollActiveSelectedItemInView();
        preventDefault = true;
        break;

      case 'Backspace':
      case 'Delete':
        if (firstItem.isSameNode(currentItem)) {
          this.removeSelectedItem(currentItem);
          this.setSelectedItemActiveDescendant(this.getFirstSelectedItem());
        } else {
          this.setSelectedItemActiveDescendant(this.getPreviousSelectedItem());
          this.removeSelectedItem(currentItem);
        }
        preventDefault = true;
        break;

      default:
        break;
      }

      if (preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
    });
  }

  isPrintableCharacter(str) {
    return str.length === DCFUtility.magicNumbers('int1') && str.match(/\S| /);
  }

  isAvailableItemsOpen() {
    return !this.availableItemsListElement.classList.contains('dcf-d-none');
  }

  openAvailableItems() {
    this.inputElement.setAttribute('aria-expanded', 'true');
    this.openButtonElement.setAttribute('aria-expanded', 'true');

    this.availableItemsListElement.classList.remove('dcf-d-none');
  }

  closeAvailableItems(force) {
    let formattedForce = force;
    if (typeof formattedForce !== 'boolean') {
      formattedForce = false;
    }
    this.inputElement.setAttribute('aria-expanded', 'false');
    this.openButtonElement.setAttribute('aria-expanded', 'false');

    this.availableItemsListElement.classList.add('dcf-d-none');
  }

  visualFocusOnAvailableItems() {
    return this.availableItemsListElement.dataset.focused === 'true';
  }

  visualFocusOnSelectedItems() {
    return this.selectedItemsListElement.dataset.focused === 'true';
  }

  setVisualFocusOn(elementToFocus) {
    if (this.currentFocus !== null && this.selectedItemsListElement.isSameNode(this.currentFocus)) {
      this.searchAreaElement.classList.remove('dcf-search-and-select-visual-focus');
      delete this.selectedItemsListElement.dataset.focused;
    } else if (this.currentFocus !== null && this.availableItemsListElement.isSameNode(this.currentFocus)) {
      this.searchAreaElement.classList.remove('dcf-search-and-select-visual-focus');
      delete this.availableItemsListElement.dataset.focused;
    } else if (this.currentFocus !== null) {
      this.currentFocus.classList.remove('dcf-search-and-select-visual-focus');
      delete this.currentFocus.dataset.focused;
    }

    if (elementToFocus !== false && this.selectedItemsListElement.isSameNode(elementToFocus)) {
      this.searchAreaElement.classList.add('dcf-search-and-select-visual-focus');
      this.selectedItemsListElement.dataset.focused = 'true';
      this.currentFocus = elementToFocus;
    } else if (elementToFocus !== false && this.availableItemsListElement.isSameNode(elementToFocus)) {
      this.searchAreaElement.classList.add('dcf-search-and-select-visual-focus');
      this.availableItemsListElement.dataset.focused = 'true';
      this.currentFocus = elementToFocus;
    } else if (elementToFocus !== false) {
      elementToFocus.classList.add('dcf-search-and-select-visual-focus');
      elementToFocus.dataset.focused = 'true';
      this.currentFocus = elementToFocus;
    } else {
      this.currentFocus = null;
    }
  }

  setVisualHover(elementToHover) {
    this.searchAndSelectElement.querySelectorAll('.dcf-search-and-select-visual-hover').forEach((elem) => {
      elem.classList.remove('dcf-search-and-select-visual-hover');
    });

    if (elementToHover !== false) {
      elementToHover.classList.add('dcf-search-and-select-visual-hover');
      this.currentHover = elementToHover;
    } else {
      this.currentHover = null;
    }
  }

  getAvailableItemActiveDescendant() {
    const currentItemID = this.inputElement.getAttribute('aria-activedescendant');
    if (currentItemID !== null && currentItemID !== '') {
      const currentItemElement = document.getElementById(currentItemID);
      if (currentItemElement !== null) {
        return currentItemElement;
      }
    }

    return false;
  }

  setAvailableItemActiveDescendant(itemToSet) {
    if (itemToSet !== false) {
      this.inputElement.setAttribute('aria-activedescendant', itemToSet.getAttribute('id'));
      this.setVisualHover(itemToSet);
    } else {
      this.setVisualHover(false);
      this.inputElement.setAttribute('aria-activedescendant', '');
    }
  }

  scrollActiveAvailableItemInView() {
    const currentItemElement = this.getAvailableItemActiveDescendant();
    if (!this.isAvailableItemInView(currentItemElement)) {
      currentItemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  getSelectedItemActiveDescendant() {
    const currentItemID = this.selectedItemsListElement.getAttribute('aria-activedescendant');
    if (currentItemID !== null && currentItemID !== '') {
      const currentItemElement = document.getElementById(currentItemID);
      if (currentItemElement !== null) {
        return currentItemElement;
      }
    }

    return false;
  }

  setSelectedItemActiveDescendant(itemToSet) {
    if (itemToSet !== false) {
      this.selectedItemsListElement.setAttribute('aria-activedescendant', itemToSet.getAttribute('id'));
      this.setVisualHover(itemToSet);
    } else {
      this.setVisualHover(false);
      this.selectedItemsListElement.setAttribute('aria-activedescendant', '');
    }
  }

  scrollActiveSelectedItemInView() {
    const currentItemElement = this.getSelectedItemActiveDescendant();
    if (!this.isSelectedItemInView(currentItemElement)) {
      currentItemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  getNextAvailableItem() {
    let nextElement = null;
    let nextElementFlag = false;
    for (let index = 0; index < this.listOfAvailableItems.length; index++) {
      if (nextElementFlag) {
        nextElement = this.listOfAvailableItems[index];
        break;
      }
      if (this.listOfAvailableItems[index].getAttribute('id') === this.inputElement.getAttribute('aria-activedescendant')) {
        nextElementFlag = true;
      }
    }

    if (nextElement === null) {
      return this.getFirstAvailableItem();
    }
    return nextElement;
  }
  getPreviousAvailableItem() {
    let previousElement = null;
    for (let index = 0; index < this.listOfAvailableItems.length; index++) {
      if (this.listOfAvailableItems[index].getAttribute('id') === this.inputElement.getAttribute('aria-activedescendant')) {
        break;
      }
      previousElement = this.listOfAvailableItems[index];
    }

    if (previousElement === null) {
      return this.getLastAvailableItem();
    }
    return previousElement;
  }
  getFirstAvailableItem() {
    if (this.listOfAvailableItems.length === DCFUtility.magicNumbers('int0')) {
      return false;
    }
    return this.listOfAvailableItems[DCFUtility.magicNumbers('int0')];
  }
  getLastAvailableItem() {
    if (this.listOfAvailableItems.length === DCFUtility.magicNumbers('int0')) {
      return false;
    }
    return this.listOfAvailableItems[this.listOfAvailableItems.length - DCFUtility.magicNumbers('int1')];
  }

  getNextSelectedItem() {
    let currentItem = this.getSelectedItemActiveDescendant();
    if (currentItem === false) {
      return this.getFirstSelectedItem();
    }

    let nextElement = currentItem.nextElementSibling;
    if (nextElement === null) {
      return this.getFirstSelectedItem();
    }

    return nextElement;
  }
  getPreviousSelectedItem() {
    let currentItem = this.getSelectedItemActiveDescendant();
    if (currentItem === false) {
      return this.getLastSelectedItem();
    }

    let nextElement = currentItem.previousElementSibling;
    if (nextElement === null) {
      return this.getLastSelectedItem();
    }

    return nextElement;
  }
  getFirstSelectedItem() {
    const allSelectedItems = this.selectedItemsListElement.children;
    if (allSelectedItems.length === DCFUtility.magicNumbers('int0')) {
      return false;
    }
    return allSelectedItems[DCFUtility.magicNumbers('int0')];
  }
  getLastSelectedItem() {
    const allSelectedItems = this.selectedItemsListElement.children;
    if (allSelectedItems.length === DCFUtility.magicNumbers('int0')) {
      return false;
    }
    return allSelectedItems[allSelectedItems.length - DCFUtility.magicNumbers('int1')];
  }

  selectAvailableItem(itemToSelect) {
    itemToSelect.setAttribute('aria-selected', 'true');
    this.selectElement.querySelectorAll('option').forEach((singleOption) => {
      if (singleOption.value === itemToSelect.dataset.value) {
        singleOption.setAttribute('selected', 'selected');
      }
    });
    this.appendNewSelectedItem(itemToSelect);
    this.selectedItemsListElement.setAttribute('tabindex', '0');
  }

  removeAvailableItem(itemToRemove) {
    itemToRemove.setAttribute('aria-selected', 'false');
    this.selectElement.querySelectorAll('option').forEach((singleOption) => {
      if (singleOption.value === itemToRemove.dataset.value) {
        singleOption.removeAttribute('selected');
      }
    });
    this.selectedItemsListElement.querySelectorAll(`li[data-id="${itemToRemove.dataset.id}"]`).forEach((singleSelectedItem) => {
      singleSelectedItem.remove();
    });
    if (this.selectedItemsListElement.children.length === DCFUtility.magicNumbers('int0')) {
      this.selectedItemsListElement.setAttribute('tabindex', '-1');
    }
  }

  removeSelectedItem(itemToRemove) {
    const availableItem = this.availableItemsListElement.querySelector(`li[data-id="${ itemToRemove.dataset.id }"]`);
    availableItem.setAttribute('aria-selected', 'false');
    this.selectElement.querySelectorAll('option').forEach((singleOption) => {
      if (singleOption.value === availableItem.dataset.value) {
        singleOption.removeAttribute('selected');
      }
    });
    itemToRemove.remove();
    if (this.selectedItemsListElement.children.length === DCFUtility.magicNumbers('int0')) {
      this.selectedItemsListElement.setAttribute('tabindex', '-1');
      this.inputElement.focus();
    }
  }

  isAvailableItemSelected(itemToCheck) {
    return itemToCheck.getAttribute('aria-selected') === 'true';
  }

  isAvailableItemInView(itemToCheck) {
    // Get the bounding client rect of the ul and li
    const listRect = this.availableItemsListElement.getBoundingClientRect();
    const itemToCheckRect = itemToCheck.getBoundingClientRect();

    // Check if the li is vertically in view within the ul
    return itemToCheckRect.top >= listRect.top &&
      itemToCheckRect.bottom <= listRect.bottom;
  }

  isSelectedItemInView(itemToCheck) {
    // Get the bounding client rect of the ul and li
    const listRect = this.searchAreaElement.getBoundingClientRect();
    const itemToCheckRect = itemToCheck.getBoundingClientRect();

    // Check if the li is vertically in view within the ul
    return itemToCheckRect.top >= listRect.top &&
      itemToCheckRect.bottom <= listRect.bottom;
  }

  filterAvailableItems() {
    const searchTerm = this.inputElement.value.trim().toUpperCase();
    const allItems = this.availableItemsListElement.querySelectorAll('li.dcf-search-and-select-item');
    const allItemGroups = this.availableItemsListElement.querySelectorAll('.dcf-search-and-select-item-group');
    this.listOfAvailableItems = [];

    this.availableItemsListElement.querySelectorAll('.dcf-search-and-select-no-results').forEach((singleNoResult) => {
      singleNoResult.remove();
    });

    let noItemsFound = true;
    allItems.forEach((singleItem) => {
      const itemLabel = singleItem.querySelector('.dcf-search-and-select-item-label').innerText.toUpperCase();
      if (searchTerm === '' || itemLabel.includes(searchTerm)) {
        singleItem.classList.remove('dcf-d-none');
        singleItem.classList.add('dcf-d-flex');
        this.listOfAvailableItems.push(singleItem);
        noItemsFound = false;
      } else {
        singleItem.classList.add('dcf-d-none');
        singleItem.classList.remove('dcf-d-flex');
      }
    });

    allItemGroups.forEach((singleGroup) => {
      if (singleGroup.querySelectorAll('.dcf-search-and-select-item:not(.dcf-d-none)').length === DCFUtility.magicNumbers('int0')) {
        singleGroup.classList.add('dcf-d-none');
      } else {
        singleGroup.classList.remove('dcf-d-none');
      }
    });

    if (noItemsFound) {
      let noItemsFoundElement = document.createElement('ul');
      noItemsFoundElement.setAttribute('role', 'presentation');
      noItemsFoundElement.classList.add('dcf-search-and-select-no-results', 'dcf-m-0', 'dcf-p-0');

      noItemsFoundElement.innerHTML = `
        <li class="dcf-m-0 dcf-bold" role="option">
          No results found
        </li>
      `;

      this.availableItemsListElement.append(noItemsFoundElement);
    }
  }
}

export class DCFSearchSelect {
  // Set up the button
  constructor(selects, theme) {
    if (theme instanceof DCFSearchSelectTheme) {
      this.theme = theme;
    } else {
      this.theme = new DCFSearchSelectTheme();
    }

    // Create a random ID for the button
    this.uuid = DCFUtility.uuidv4();

    // This has no use except to pass linting
    this.selectsObjs = [];

    // Store the button inputted (always will be an array )
    /** @type { Array<HTMLSelectElement> } */
    this.selects = selects;
    if (NodeList.prototype.isPrototypeOf(this.selects)) {
      this.selects = Array.from(this.selects);
    } else if (!Array.isArray(this.selects)) {
      this.selects = [ this.selects ];
    }
  }

  // The names of the events to be used easily
  static events(name) {
    // Define any new events
    const events = {
    };
    Object.freeze(events);

    // Return the name of the event if it exists if not it will return undefined
    return name in events ? events[name] : undefined;
  }

  // Initialize the buttons that were inputted in the constructor
  initialize() {
    // Loops through each one
    this.selects.forEach((selectElement, index) => {
      // TODO: Set up all attributes on select element
      selectElement.setAttribute('id', selectElement.getAttribute('id') || this.uuid.concat('-search-and-select-label-', index));

      this.selectsObjs.push(new DCFSearchSelectClass(selectElement));
    });
  }
}
