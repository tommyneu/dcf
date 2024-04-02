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

    const modalPrevButton = modalDiv.querySelector('.dcf-gallery-image-modal-prev');
    const modalNextButton = modalDiv.querySelector('.dcf-gallery-image-modal-next');

    modalPrevButton.addEventListener('click', () => {
      this.previousImageForModal();
    });
    modalNextButton.addEventListener('click', () => {
      this.nextImageForModal();
    });

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
        <div class="dcf-d-flex dcf-flex-col dcf-flex-nowrap dcf-2nd">
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
              ">
                <span class="dcf-sr-only">Previous Image</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 30 36"
                  class="dcf-fill-current
                  dcf-h-4 dcf-w-4 dcf-d-block"
                  style="rotate: 180deg;"
                >
                  <path d="M25.5,15.3L9.3,0.9C8.6,0.3,7.6,0,6.7,0c-1,0.1-1.9,0.5-2.5,1.2
                  C3.5,2,3.2,2.9,3.3,3.8c0.1,1,0.5,1.9,1.2,2.5L17.7,18
                  L4.5,29.7c-0.7,0.6-1.2,1.5-1.2,2.5c-0.1,1,0.3,1.9,0.9,2.6
                  C4.8,35.5,5.8,36,6.9,36c0.9,0,1.7-0.3,2.4-0.9l16.3-14.4
                  c0.8-0.7,1.2-1.7,1.2-2.7S26.3,16,25.5,15.3z"/>
                </svg>
              </button>
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
              ">
                <span class="dcf-sr-only">Next Image</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 30 36"
                  class="dcf-fill-current dcf-h-4 dcf-w-4 dcf-d-block"
                >
                  <path d="M25.5,15.3L9.3,0.9C8.6,0.3,7.6,0,6.7,0c-1,0.1-1.9,0.5-2.5,1.2
                  C3.5,2,3.2,2.9,3.3,3.8c0.1,1,0.5,1.9,1.2,2.5L17.7,18
                  L4.5,29.7c-0.7,0.6-1.2,1.5-1.2,2.5c-0.1,1,0.3,1.9,0.9,2.6
                  C4.8,35.5,5.8,36,6.9,36c0.9,0,1.7-0.3,2.4-0.9l16.3-14.4
                  c0.8-0.7,1.2-1.7,1.2-2.7S26.3,16,25.5,15.3z"/>
                </svg>
              </button>
          </div>
          <div class="dcf-overflow-y-hidden dcf-overflow-x-auto dcf-pt-4 dcf-pr-6 dcf-pb-4 dcf-pl-6">
            <ul
              role="tablist"
              aria-label="images"
              class="
                dcf-gallery-image-modal-list
                dcf-d-flex
                dcf-flex-nowrap
                dcf-mb-0
                dcf-p-0
                dcf-gap-3
              "
            ></ul>
          </div>
        </div>
        <figure
          role="tabpanel"
          aria-live="polite"
          class="dcf-d-flex dcf-flex-nowrap dcf-flex-col dcf-ai-center dcf-jc-center dcf-w-100% dcf-m-auto dcf-1st"
        >
        </figure>
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
    allGalleryImages.forEach((singleImage, index) => {
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
        <li
          role="tab"
          aria-selected="${isSelected ? 'true' : 'false'}"
          aria-label="image ${index + DCFUtility.magicNumbers('int1')}"
          tabindex="${isSelected ? '0' : '-1'}"
          class="dcf-ratio dcf-ratio-4x3 dcf-w-10 dcf-mb-0 dcf-rounded dcf-overflow-hidden"
        >
          ${singleCopiedImage.outerHTML}
        </li>
      `;
    });

    const listItems = list.querySelectorAll('li');
    listItems.forEach((listItem) => {
      listItem.addEventListener('click', () => {
        this.switchToImage(listItem);
      });
      listItem.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.code === 'ArrowRight') {
          this.nextImageForModal(true);
        }
        if (keyboardEvent.code === 'ArrowLeft') {
          this.previousImageForModal(true);
        }
        if (keyboardEvent.code === 'Home') {
          this.switchToImage(listItems[DCFUtility.magicNumbers('int0')], true);
        }
        if (keyboardEvent.code === 'End') {
          this.switchToImage(listItems[listItems.length - DCFUtility.magicNumbers('int1')], true);
        }
      });
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

  previousImageForModal(focus = false) {
    const modal = document.getElementById(this.modalId);
    if (modal === null) {
      throw new Error('Can not find gallery image modal!');
    }

    const list = modal.querySelector('ul');
    if (list === null) {
      throw new Error('Can not find gallery image figure!');
    }

    const allImages = list.querySelectorAll('li');
    const currentImage = list.querySelector('li[aria-selected="true"]');
    const prevImage = currentImage.previousElementSibling || allImages[allImages.length - DCFUtility.magicNumbers('int1')];

    this.switchToImage(prevImage, focus);
  }

  nextImageForModal(focus = false) {
    const modal = document.getElementById(this.modalId);
    if (modal === null) {
      throw new Error('Can not find gallery image modal!');
    }

    const list = modal.querySelector('ul');
    if (list === null) {
      throw new Error('Can not find gallery image figure!');
    }

    const allImages = list.querySelectorAll('li');
    const currentImage = list.querySelector('li[aria-selected="true"]');
    const nextImage = currentImage.nextElementSibling || allImages[DCFUtility.magicNumbers('int0')];

    this.switchToImage(nextImage, focus);
  }

  switchToImage(newItemToSwitchTo, focus = false) {
    const modal = document.getElementById(this.modalId);
    if (modal === null) {
      throw new Error('Can not find gallery image modal!');
    }

    const list = modal.querySelector('ul');
    if (list === null) {
      throw new Error('Can not find gallery image figure!');
    }

    const allImages = list.querySelectorAll('li');
    allImages.forEach((singleListItem) => {
      singleListItem.setAttribute('tabindex', '-1');
      singleListItem.setAttribute('aria-selected', 'false');
    });
    newItemToSwitchTo.setAttribute('tabindex', '0');
    newItemToSwitchTo.setAttribute('aria-selected', 'true');

    if (focus === true) {
      newItemToSwitchTo.focus();
    }

    this.replaceMainImageForModal(newItemToSwitchTo.querySelector('img'));
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
    copiedImageElement.classList.add('dcf-obj-fit-contain');
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
    copiedImageElement.classList.remove('dcf-gallery-img', 'dcf-btn-toggle-modal', 'dcf-ratio-child', 'dcf-obj-fit-cover');
    copiedImageElement.removeAttribute('type');
    copiedImageElement.removeAttribute('disabled');
    copiedImageElement.removeAttribute('id');

    return copiedImageElement;
  }
}
