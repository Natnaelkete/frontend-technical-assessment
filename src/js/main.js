import { DragDrop } from "./dragDrop.js";

document.addEventListener("DOMContentLoaded", () => {
  const dd = new DragDrop({
    root: document,
    itemSelector: ".draggable-item",
    dropSelector: ".drop-zone",
  });
  dd.init();
});
