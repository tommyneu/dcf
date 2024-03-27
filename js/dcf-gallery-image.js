import { DCFUtility } from './dcf-utility';
import { DCFModal } from './dcf-modal';

export class DCFGalleryImageTheme {
  constructor() {
  }

  // Allows us to set the theme variables if they are defined and we match the types
  setThemeVariable(themeVariableName, value) {
    if (themeVariableName in this && typeof value == typeof this[themeVariableName]) {
      this[themeVariableName] = value;
    }
  }
}

export class DCFGalleryImage {
  // Set up the button
  constructor(galleryImages, theme, bodyScrollLock, options = {}) {
    if (theme instanceof DCFGalleryImageTheme) {
      this.theme = theme;
    } else {
      this.theme = new DCFGalleryImageTheme();
    }

    // Create a random ID for the button
    this.uuid = DCFUtility.uuidv4();

    this.bodyScrollLock = bodyScrollLock;
    this.modalId = this.uuid.concat('-gallery-image-modal');
    this.galleryImageRunningTotal = 0;

    // Store the gallery images inputted (always will be an array )
    /** @type {Array<HTMLImageElement>} */
    this.galleryImages = galleryImages;
    if (NodeList.prototype.isPrototypeOf(this.galleryImages)) {
      this.galleryImages = Array.from(this.galleryImages);
    } else if (!Array.isArray(this.galleryImages)) {
      this.galleryImages = [ this.galleryImages ];
    }
  }

  // The names of the events to be used easily
  static events(name) {
    // Define any new events
    const events = {
    };
    Object.freeze(events);

    // Forward the events from the DCFModal
    if (DCFModal.events(name) !== undefined) {
      return DCFModal.events(name);
    }

    // Return the name of the event if it exists if not it will return undefined
    return name in events ? events[name] : undefined;
  }

  initialize() {
    const modalDiv = this.createEmptyModal();
    document.body.append(modalDiv);
    this.modalObj = new DCFModal([ modalDiv ], this.bodyScrollLock);
    this.modalObj.initialize();
    this.createModalEventListeners(modalDiv);

    // Loops through each one
    this.galleryImages.forEach((galleryImage) => {
      if (!('tagName' in galleryImage) || galleryImage.tagName !== 'IMG') {
        throw new Error(`Gallery image is not an image: \n "${galleryImage.outerHTML}"`);
      }

      this.addNewGalleryImage(galleryImage);
      console.dir(galleryImage);
    });
  }

  /**
   * @returns { HTMLDivElement }
   */
  createEmptyModal() {
    let modalHeading = document.createElement('h2');
    modalHeading.classList.add('dcf-sr-only');
    modalHeading.innerHTML = 'Image Gallery';

    let modalCloseButton = document.createElement('button');
    modalCloseButton.classList.add('dcf-btn-close-modal');
    modalCloseButton.innerHTML = 'Close';

    let modalHeadDiv = document.createElement('div');
    modalHeadDiv.classList.add('dcf-modal-header');
    modalHeadDiv.append(modalHeading);
    modalHeadDiv.append(modalCloseButton);

    let modalBodyDiv = document.createElement('div');
    modalBodyDiv.classList.add('dcf-modal-content');

    let modalWrapperDiv = document.createElement('div');
    modalWrapperDiv.classList.add('dcf-modal-wrapper');
    modalWrapperDiv.append(modalHeadDiv);
    modalWrapperDiv.append(modalBodyDiv);

    let modalDiv = document.createElement('div');
    modalDiv.classList.add('dcf-modal');
    modalDiv.dataset.galleryImage = 'galleryImage';
    modalDiv.setAttribute('id', this.modalId);
    modalDiv.setAttribute('hidden', 'hidden');
    modalDiv.append(modalWrapperDiv);

    return modalDiv;
  }

  /**
   * @param { HTMLImageElement } imageElement New Image to be added as modal button
   */
  addNewGalleryImage(imageElement) {
    if (imageElement.getAttribute('id') === null) {
      imageElement.setAttribute('id', this.uuid.concat('-gallery-image-', this.galleryImageRunningTotal));
    }

    imageElement.classList.add('dcf-btn-toggle-modal');
    imageElement.classList.add('dcf-btn');
    imageElement.setAttribute('type', 'button');
    imageElement.setAttribute('disabled', 'disabled');
    imageElement.dataset.ready = 'ready';
    imageElement.dataset.togglesModal = this.modalId;
    this.modalObj.btnToggleListen(imageElement, this.modalId, imageElement.getAttribute('id'));

    this.galleryImageRunningTotal++;
  }

  /**
   */
  createModalEventListeners() {
    const modalPreOpenEventName = `ModalPreOpenEvent_${this.modalId}`;
    document.addEventListener(modalPreOpenEventName, this.openModal.bind(this));
  }

  openModal(event) {
    console.log(event);
    const allGalleryImages = document.querySelectorAll('img.dcf-gallery-img');
    const startingImage = event.detail.btn;
    console.log(allGalleryImages, startingImage);
  }
}
