import { DCFUtility } from './dcf-utility';

/**
 * @typedef {Object} parsedOption
 * @property {'option'} tag - The option's tag
 * @property {string} label - The option's label
 * @property {HTMLOptionElement} element - The options's original element
 */

/**
 * @typedef {Object} parsedOptgroup
 * @property {'optgroup'} tag - The optgroup tag
 * @property {string} label - The optgroup's label
 * @property {HTMLOptGroupElement} element - The optgroup's original element
 * @property {Array<parsedOption|parsedOptgroup>} items - The optgroup's children
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
      console.log(selectElement, index);

      const parsedSelect = this.parseSelect(selectElement);
      const availableItems = this.buildAvailableItems(parsedSelect);
      console.log(availableItems);

      if (this.theme.availableItemsClassList) {
        this.theme.availableItemsClassList.forEach((cssClass) => {
          availableItems.classList.add(cssClass);
        });
      }

      const searchAndSelectTemplate = document.createElement('div');
      searchAndSelectTemplate.innerHTML = `
        <div
          class="
            dcf-search-and-select-search-area
            dcf-relative
            dcf-d-grid
            dcf-overflow-x-hidden
            dcf-overflow-y-auto
            dcf-b-1
            dcf-b-solid
            dcf-rounded-top
            dcf-rounded-right
          "
        >
          <ul class="dcf-search-and-select-selected-items dcf-d-flex dcf-flex-wrap dcf-gap-3 dcf-m-0 dcf-p-3">
            <li class="dcf-d-flex dcf-flex-nowrap dcf-m-0 dcf-ai-center dcf-jc-center">
              <button class="dcf-btn dcf-btn-secondary dcf-m-0 dcf-p-1 dcf-h-100% dcf-sharp dcf-rounded-left" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="dcf-fill-current dcf-w-4 dcf-h-4 dcf-d-block">
                  <path d="M23.707,22.293L13.414,12L23.706,1.707c0.391-0.39,0.391-1.023,0-1.414
                    c-0.391-0.391-1.023-0.391-1.414,0L12,10.586 L1.706,0.292c-0.391-0.39-1.023-0.39-1.414,0
                    c-0.391,0.391-0.391,1.023,0,1.414L10.586,12L0.292,22.294 c-0.39,0.39-0.391,1.024,0,1.414
                    c0.391,0.391,1.024,0.39,1.414,0L12,13.414l10.293,10.292c0.39,0.391,1.023,0.391,1.414,0
                    C24.098,23.316,24.097,22.683,23.707,22.293z"></path>
                </svg>
              </button>
              <span class="dcf-rounded-right dcf-b-1 dcf-b-solid dcf-p-1">
                ice cream
              </span>
            </li>
          </ul>
          <div class="dcf-search-and-select-open-btn dcf-sticky dcf-top-50% dcf-h-0 dcf-pl-1 dcf-pr-1">
            <button class="dcf-btn dcf-btn-tertiary dcf-m-0 dcf-p-3" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="dcf-fill-current dcf-w-3 dcf-h-3 dcf-d-block">
                <path d="M23.936,2.255C23.848,2.098,23.681,2,23.5,2h-23
                  C0.32,2,0.153,2.098,0.065,2.255c-0.089,0.157-0.085,0.35,0.008,0.504
                  l11.5,19C11.663,21.908,11.826,22,12,22s0.337-0.092,0.428-0.241
                  l11.5-19C24.021,2.605,24.025,2.412,23.936,2.255z"></path>
              </svg>
            </button>
          </div>
          <input class="dcf-m-2 dcf-b-0" type="text" id=${this.uuid.concat('-search-and-select-input-', index)}>
        </div>
        <div class="dcf-search-and-select-available-items dcf-w-100% dcf-absolute dcf-d-none dcf-z-1">
          ${ availableItems.outerHTML }
        </div>
        <button class="dcf-search-and-select-clear-btn dcf-btn dcf-btn-secondary dcf-sharp dcf-rounded-bottom">
          Clear Selection
        </button>
      `;
      searchAndSelectTemplate.classList.add('dcf-search-and-select', 'dcf-relative');
      searchAndSelectTemplate.setAttribute('id', this.uuid.concat('-search-and-select-', index));
      selectElement.after(searchAndSelectTemplate);

      const label = document.querySelector(`label[for=${selectElement.getAttribute('id')}]`);
      label.setAttribute('for', this.uuid.concat('-search-and-select-input-', index));

      this.addEventListeners(searchAndSelectTemplate);
    });
  }

  /**
   * Recursively parses the select/optgroups
   * @param { HTMLSelectElement|HTMLOptGroupElement } selectOrOptgroup The select or optgroup to parse
   * @returns { Array<parsedOption|parsedOptgroup> }
   */
  parseSelect(selectOrOptgroup) {
    let output = [];

    for (const optgroupOrOption of selectOrOptgroup.children) {
      if (optgroupOrOption.tagName === 'OPTGROUP') {
        output.push({
          tag: 'optgroup',
          label: optgroupOrOption.getAttribute('label'),
          element: optgroupOrOption,
          items: this.parseSelect(optgroupOrOption),
        });
      } else if (optgroupOrOption.tagName === 'OPTION') {
        output.push({
          tag: 'option',
          label: optgroupOrOption.innerHTML,
          element: optgroupOrOption,
        });
      }
    }

    return output;
  }

  /**
   * Recursively builds the available items UL from output of parse select
   * @param { Array<parsedOption|parsedOptgroup> } parsedSelect Output from parseSelect
   * @returns { HTMLUListElement }
   */
  buildAvailableItems(parsedSelect) {
    let availableItems = document.createElement('ul');

    parsedSelect.forEach((optgroupOrOption) => {
      if (optgroupOrOption.tag === 'optgroup') {
        availableItems.innerHTML = `
          ${ availableItems.innerHTML }
          <li>
            ${ optgroupOrOption.label }
            ${ this.buildAvailableItems(optgroupOrOption.items).outerHTML }
          </li>
        `;
      } else {
        availableItems.innerHTML = `
          ${ availableItems.innerHTML }
          <li>
            ${ optgroupOrOption.label }
          </li>
        `;
      }
    });

    return availableItems;
  }

  /**
   * Add event listeners for the different pares of the search and select element
   * @param { HTMLDivElement } searchAndSelectElement The search and select element
   */
  addEventListeners(searchAndSelectElement) {
    const searchArea = searchAndSelectElement.querySelector('.dcf-search-and-select-search-area');
    const inputElement = searchAndSelectElement.querySelector('input');
    const availableItemsElement = searchAndSelectElement.querySelector('.dcf-search-and-select-available-items');
    const openButton = searchAndSelectElement.querySelector('.dcf-search-and-select-open-btn button');
    const clearButton = searchAndSelectElement.querySelector('.dcf-search-and-select-clear-btn');

    document.addEventListener('click', (event) => {
      const closestSearchAndSelect = event.target.closest('.dcf-search-and-select');
      if (
        closestSearchAndSelect === null ||
        closestSearchAndSelect.getAttribute('id') !== searchAndSelectElement.getAttribute('id')
      ) {
        availableItemsElement.classList.add('dcf-d-none');
      }
    });

    searchArea.addEventListener('click', (event) => {
      console.log(event.target);
      if (
        event.target.classList.contains('dcf-search-and-select-search-area') ||
        event.target.classList.contains('dcf-search-and-select-selected-items')
      ) {
        availableItemsElement.classList.remove('dcf-d-none');
        inputElement.focus();
      }
    }, false);

    inputElement.addEventListener('focus', () => {
      availableItemsElement.classList.remove('dcf-d-none');
    });

    openButton.addEventListener('click', () => {
      if (availableItemsElement.classList.contains('dcf-d-none')) {
        openButton.querySelector('svg').style.rotate = '180deg';
        availableItemsElement.classList.remove('dcf-d-none');
        inputElement.focus();
      } else {
        openButton.querySelector('svg').style.rotate = '0deg';
        availableItemsElement.classList.add('dcf-d-none');
      }
    });
  }
}
