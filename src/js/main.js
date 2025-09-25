import { DragDrop } from "./dragDrop.js";
import { BlogList } from "./BlogList.js";
import { Navigation } from "./navigation.js";

document.addEventListener("DOMContentLoaded", () => {
  const dd = new DragDrop({
    root: document,
    itemSelector: ".draggable-item",
    dropSelector: ".drop-zone",
  });
  dd.init();

  const blogSection = document.querySelector("#list-section");
  if (blogSection) {
    const blogList = new BlogList(blogSection);
    blogList.init();
  }

  const navigation = new Navigation();
});
