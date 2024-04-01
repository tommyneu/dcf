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
  constructor(galleryImages, theme, bodyScrollLock) {
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
    });
  }

  /**
   * @returns { HTMLDivElement }
   */
  createEmptyModal() {
    let modalDiv = document.createElement('div');
    modalDiv.classList.add('dcf-modal');
    modalDiv.dataset.galleryImage = 'galleryImage';
    modalDiv.setAttribute('id', this.modalId);
    modalDiv.setAttribute('hidden', 'hidden');
    modalDiv.innerHTML = `
    <div class="dcf-modal-wrapper">
      <div class="dcf-modal-header">
        <h2 class="dcf-sr-only">Image Gallery</h2>
        <button class="dcf-btn-close-modal">Close</button>
      </div>
      <div class="dcf-modal-content dcf-gallery-image-modal-content">
        <figure class="dcf-d-flex dcf-flex-col dcf-flex-nowrap dcf-ai-center dcf-jc-center">
        </figure>
        <div class="dcf-d-flex dcf-flex-col dcf-flex-nowrap">
          <div class="dcf-d-flex dcf-flex-row dcf-flex-nowrap dcf-jc-flex-end dcf-gap-1 dcf-mr-3">
            <button
              class="
                dcf-btn
                dcf-btn-secondary
                dcf-gallery-image-modal-prev
                dcf-circle
                dcf-p-0
                dcf-h-7
                dcf-w-7
                dcf-d-flex
                dcf-jc-center
                dcf-ai-center
              "> < </button>
              <button
              class="
                dcf-btn
                dcf-btn-secondary
                dcf-gallery-image-modal-next
                dcf-circle
                dcf-p-0
                dcf-h-7
                dcf-w-7
                dcf-d-flex
                dcf-jc-center
                dcf-ai-center
              "> > </button>
          </div>
          <ul
            class="
              dcf-gallery-image-modal-list
              dcf-d-flex
              dcf-flex-row
              dcf-flex-nowrap
              dcf-overflow-y-hidden
              dcf-overflow-x-auto
              dcf-m-0
              dcf-p-0
              dcf-gap-3
            "
            role="list"
          ></ul>
        </div>
      </div>
    </div>
    `;

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
    imageElement.setAttribute('type', 'button');
    imageElement.dataset.ready = 'ready';
    imageElement.dataset.togglesModal = this.modalId;

    this.galleryImageRunningTotal++;
  }

  /**
   */
  createModalEventListeners() {
    const modalPreOpenEventName = `ModalPreOpenEvent_${this.modalId}`;
    const modalPostCloseEventName = `ModalCloseEvent_${this.modalId}`;
    document.addEventListener(modalPreOpenEventName, this.openModal.bind(this));
    document.addEventListener(modalPostCloseEventName, this.closeModal.bind(this));

    document.addEventListener('click', (event) => {
      const closestGalleryImage = event.target.closest('img.dcf-gallery-img');
      if (closestGalleryImage === null) {
        return;
      }

      if (closestGalleryImage.dataset.ready !== 'ready') {
        this.addNewGalleryImage(closestGalleryImage);
      }

      this.modalObj.toggleModal(this.modalId, closestGalleryImage.getAttribute('id'));
    });
  }

  openModal(event) {
    const modal = document.getElementById(this.modalId);
    if (modal === null) {
      throw new Error('Can not find gallery image modal!');
    }

    const allGalleryImages = document.querySelectorAll('img.dcf-gallery-img');
    let startingImage = event.detail.btn || null;
    if (allGalleryImages.length === DCFUtility.magicNumbers('int0')) {
      throw new Error('Can not find any gallery images!');
    }
    if (startingImage === null) {
      startingImage = allGalleryImages[DCFUtility.magicNumbers('int0')];
    }

    const list = modal.querySelector('ul');
    if (list === null) {
      throw new Error('Can not find gallery image figure!');
    }

    list.innerHTML = '';
    allGalleryImages.forEach((singleImage) => {
      if (singleImage.dataset.ready !== 'ready') {
        this.addNewGalleryImage(singleImage);
      }

      let isSelected = false;
      if (singleImage.getAttribute('id') === startingImage.getAttribute('id')) {
        this.replaceMainImageForModal(singleImage);
        isSelected = true;
      }

      const singleCopiedImage = this.cleanImageForModal(singleImage);
      singleCopiedImage.classList.add('dcf-ratio-child', 'dcf-obj-fit-cover');
      list.innerHTML = `
        ${list.innerHTML}
        <li class="dcf-ratio dcf-ratio-4x3 dcf-w-10 dcf-rounded dcf-overflow-hidden ${isSelected ? 'dcf-gallery-image-selected' : ''}">
          ${singleCopiedImage.outerHTML}
        </li>
      `;
    });
  }

  closeModal() {
    const modal = document.getElementById(this.modalId);
    if (modal === null) {
      throw new Error('Can not find gallery image modal!');
    }

    const list = modal.querySelector('ul');
    const figure = modal.querySelector('figure');
    if (list === null) {
      throw new Error('Can not find gallery image list!');
    }
    if (figure === null) {
      throw new Error('Can not find gallery image figure!');
    }

    list.innerHTML = '';
    figure.innerHTML = '';
  }

  replaceMainImageForModal(imageElement) {
    const modal = document.getElementById(this.modalId);
    if (modal === null) {
      throw new Error('Can not find gallery image modal!');
    }

    const figure = modal.querySelector('figure');
    if (figure === null) {
      throw new Error('Can not find gallery image figure!');
    }

    const copiedImageElement = this.cleanImageForModal(imageElement);
    figure.innerHTML = `
      ${copiedImageElement.outerHTML}
      <figcaption class="dcf-figcaption">
        <div class="dcf-gallery-image-credit">
          ${copiedImageElement.dataset.credit || ''}
        </div>
        <div class="dcf-gallery-image-cutline">
          ${copiedImageElement.dataset.cutline || ''}
        </div>
      </figcaption>
    `;
  }

  cleanImageForModal(imageElement) {
    let copiedImageElement = imageElement.cloneNode();
    copiedImageElement.classList.remove('dcf-gallery-img');
    copiedImageElement.classList.remove('dcf-btn-toggle-modal');
    copiedImageElement.removeAttribute('type');
    copiedImageElement.removeAttribute('disabled');
    copiedImageElement.removeAttribute('id');

    return copiedImageElement;
  }
}
