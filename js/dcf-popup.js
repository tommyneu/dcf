import { DCFUtility } from './dcf-utility';
import { DCFToggleButton } from './dcf-button-toggle';

export class DCFPopupTheme {
  // Sets up the theme
  constructor() {
    this.popupClassList = [
      'dcf-relative',
    ];

    this.popupButtonClassList = [
    ];

    this.popupContentClassList = [
      'dcf-absolute',
      'dcf-z-2',
      'dcf-txt-sm'
    ];

    this.pointSize = '1rem';
    this.pointMarginSize = '4';
  }

  // Allows us to set the theme variables if they are defined and we match the types
  setThemeVariable(themeVariableName, value) {
    if (themeVariableName in this && typeof value == typeof this[themeVariableName]) {
      this[themeVariableName] = value;
    }
  }
}

export class DCFPopup {
  // Set up the button
  constructor(popups, theme, options = {}) {
    if (theme instanceof DCFPopupTheme) {
      this.theme = theme;
    } else {
      this.theme = new DCFPopupTheme();
    }

    // Events for controlling toggle button
    this.commandOpen = new Event(DCFToggleButton.events('commandOpen'));
    this.commandClose = new Event(DCFToggleButton.events('commandClose'));
    this.commandToggle = new Event(DCFToggleButton.events('commandToggle'));

    this.positions = [ 'top', 'bottom', 'left', 'right' ];
    this.alignments = [ 'start', 'center', 'end' ];

    // Create a random ID for the button
    this.uuid = DCFUtility.uuidv4();

    // Store the button inputted (always will be an array )
    this.popups = popups;
    if (NodeList.prototype.isPrototypeOf(this.popups)) {
      this.popups = Array.from(this.popups);
    } else if (!Array.isArray(this.popups)) {
      this.popups = [ this.popups ];
    }
  }

  // The names of the events to be used easily
  static events(name) {
    // Define any new events
    const events = {
    };
    Object.freeze(events);

    // Forward the events from the DCFToggleButton
    if (DCFToggleButton.events(name) !== undefined) {
      return DCFToggleButton.events(name);
    }

    // Return the name of the event if it exists if not it will return undefined
    return name in events ? events[name] : undefined;
  }

  // Initialize the buttons that were inputted in the constructor
  initialize() {
    // Loops through each one
    this.popups.forEach((popup, index) => {
      // Validate popup is a div
      if (popup.tagName !== 'DIV') {
        throw new Error('Popup Must Be Of Tag DIV');
      }

      // Adds any classes from the theme to the popup
      if (this.theme.popupClassList) {
        this.theme.popupClassList.forEach((cssClass) => {
          popup.classList.add(cssClass);
        });
      }

      // Gets the button and validates it
      const popupBtn = popup.querySelector('.dcf-btn-popup');
      if (popupBtn === null || popupBtn.tagName !== 'BUTTON') {
        throw new Error('Popup Button Is Missing Or Not A Button Tag');
      }

      // Gets the content and validates it
      const popupContent = popup.querySelector('.dcf-popup-content');
      if (popupContent === null) {
        throw new Error('Popup Content Is Missing');
      }

      const closeButton = popup.querySelector('.dcf-btn-popup-close');
      if (closeButton !== null && closeButton.tagName !== 'BUTTON') {
        throw new Error('Close Button is Not a Button Tag');
      }

      // Sets the IDs for the btn and content if they aren't already set
      if (popup.id === '') {
        popup.id = this.uuid.concat(`-popup-${index}`);
      }
      if (popupBtn.id === '') {
        popupBtn.id = this.uuid.concat(`-popup-btn-${index}`);
      }
      if (popupContent.id === '') {
        popupContent.id = this.uuid.concat(`-popup-content-${index}`);
      }

      // Adds any classes to the theme
      if (this.theme.popupButtonClassList) {
        this.theme.popupButtonClassList.forEach((cssClass) => {
          popupBtn.classList.add(cssClass);
        });
      }
      if (this.theme.popupContentClassList) {
        this.theme.popupContentClassList.forEach((cssClass) => {
          popupContent.classList.add(cssClass);
        });
      }

      // Sets up button-toggle related attributes
      popupBtn.dataset.controls = popupContent.id;
      popupBtn.dataset.startExpanded = 'false';

      popup.style.setProperty('--point_size', this.theme.pointSize);

      // Sets up position classes
      this.addPositionClasses(popup, popupContent);

      // Initializes the toggle button
      const toggleButtonObj = new DCFToggleButton(popupBtn);
      toggleButtonObj.initialize();

      // if there is a close button and its clicked close the popup
      if (closeButton !== null) {
        closeButton.addEventListener('click', () => {
          popupBtn.dispatchEvent(this.commandClose);
        });
      }

      // If we click outside the popup close the popup
      document.body.addEventListener('click', (event) => {
        const closestPopup = event.target.closest('.dcf-popup');
        if (closestPopup === null || closestPopup.id !== popup.id) {
          popupBtn.dispatchEvent(this.commandClose);
        }
      }, true);
    });
  }

  addPositionClasses(popup, popupContent) {
    let position = popup.dataset.position;
    if (position === undefined) {
      position = 'bottom';
    } else if (!this.positions.includes(position)) {
      throw new Error('Invalid Position On Popup');
    }
    let alignment = popup.dataset.alignment;
    if (alignment === undefined) {
      alignment = 'center';
    } else if (!this.alignments.includes(alignment)) {
      throw new Error('Invalid Alignment On Popup');
    }

    let point = popup.dataset.point === 'true';

    // Set up position specific classes
    if (position === 'top') {
      popupContent.classList.add('dcf-bottom-100%');
      if (point) {
        popupContent.classList.add(`dcf-mb-${this.theme.pointMarginSize}`);
      }
    } else if (position === 'bottom') {
      popupContent.classList.add('dcf-top-100%');
      if (point) {
        popupContent.classList.add(`dcf-mt-${this.theme.pointMarginSize}`);
      }
    } else if (position === 'left') {
      popupContent.classList.add('dcf-right-100%');
      if (point) {
        popupContent.classList.add(`dcf-mr-${this.theme.pointMarginSize}`);
      }
    } else if (position === 'right') {
      popupContent.classList.add('dcf-left-100%');
      if (point) {
        popupContent.classList.add(`dcf-ml-${this.theme.pointMarginSize}`);
      }
    }

    // Set up alignment classes
    if (position === 'top' || position === 'bottom') {
      if (alignment === 'start') {
        popupContent.classList.add('dcf-left-0');
      } else if (alignment === 'end') {
        popupContent.classList.add('dcf-right-0');
      } else if (alignment === 'center') {
        popupContent.classList.add('dcf-left-50%');
      }
    } else if (position === 'left' || position === 'right') {
      if (alignment === 'start') {
        popupContent.classList.add('dcf-top-0');
      } else if (alignment === 'end') {
        popupContent.classList.add('dcf-bottom-0');
      } else if (alignment === 'center') {
        popupContent.classList.add('dcf-top-50%');
      }
    }
  }
}