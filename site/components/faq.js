customElements.define(
  "slds-faq",
  class extends HTMLElement {
    connectedCallback() {
      const details = this.querySelector("details");
      details.classList.add(
        "slds-accordion__list-item",
        "slds-accordion__section"
      );
      const summary = this.querySelector("summary");
      summary.innerHTML =
        `<svg
      class="slds-accordion__summary-action-icon slds-button__icon slds-button__icon_left"
      aria-hidden="true"
      >
      <use xlink:href="./symbols.svg#switch"></use></svg
      >` + summary.innerHTML;
      summary.classList.add("slds-accordion__summary-heading");
    }
  }
);
