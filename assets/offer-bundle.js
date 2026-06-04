/**
 * Custom element for multi-product add-to-cart in the offer bundle section.
 * Reads variant IDs from data-items attribute, POSTs to /cart/add.js,
 * and dispatches 'cart:update' event for theme cart drawer/bubble integration.
 */
class OfferBundleForm extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('[data-offer-bundle-button]');
    if (!this.button) return;

    this.button.addEventListener('click', this.handleAddToCart.bind(this));
  }

  async handleAddToCart(event) {
    event.preventDefault();

    const itemsAttr = this.getAttribute('data-items');
    if (!itemsAttr) return;

    let items;
    try {
      items = JSON.parse(itemsAttr);
    } catch (e) {
      console.error('offer-bundle-form: invalid data-items JSON', e);
      return;
    }

    if (!items || items.length === 0) return;

    this.button.disabled = true;
    const originalText = this.button.querySelector('[data-button-text]');
    const originalContent = originalText ? originalText.textContent : '';

    if (originalText) {
      originalText.textContent = originalText.dataset.loadingText || 'Adding...';
    }

    try {
      const response = await fetch(Theme.routes.cart_add_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (data.status) {
        console.error('offer-bundle-form: cart add error', data.message, data.description);
        if (originalText) {
          originalText.textContent = data.message || 'Error';
          setTimeout(() => {
            originalText.textContent = originalContent;
          }, 3000);
        }
        return;
      }

      document.dispatchEvent(
        new CustomEvent('cart:update', {
          bubbles: true,
          detail: {
            resource: data,
            sourceId: this.id || 'offer-bundle-form',
            data: {
              source: 'offer-bundle-form',
              itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            },
          },
        })
      );

      if (originalText) {
        originalText.textContent = originalText.dataset.addedText || 'Added!';
        setTimeout(() => {
          originalText.textContent = originalContent;
        }, 2000);
      }
    } catch (error) {
      console.error('offer-bundle-form: fetch error', error);
      if (originalText) {
        originalText.textContent = 'Error';
        setTimeout(() => {
          originalText.textContent = originalContent;
        }, 3000);
      }
    } finally {
      this.button.disabled = false;
    }
  }
}

if (!customElements.get('offer-bundle-form')) {
  customElements.define('offer-bundle-form', OfferBundleForm);
}
