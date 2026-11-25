// Alterna a visibilidade das seções principais sem reconstruir o HTML.
export function setupNavigation(onViewChange = () => {}) {
  const buttons = document.querySelectorAll("[data-view-target]");
  const sections = document.querySelectorAll("#conteudo-principal > section");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedView = button.dataset.viewTarget;
      const selectedSectionId = `view-${selectedView}`;

      sections.forEach((section) => {
        section.hidden = section.id !== selectedSectionId;
      });

      buttons.forEach((navigationButton) => {
        if (navigationButton === button) {
          navigationButton.setAttribute("aria-current", "page");
        } else {
          navigationButton.removeAttribute("aria-current");
        }
      });

      onViewChange(selectedView);
    });
  });
}
