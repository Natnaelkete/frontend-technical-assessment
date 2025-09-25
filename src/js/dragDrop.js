export class DragDrop {
  constructor({
    itemSelector = ".draggable-item",
    dropSelector = ".drop-zone",
    root = document,
  } = {}) {
    this.root = root;
    this.itemSelector = itemSelector;
    this.dropSelector = dropSelector;
    this.items = [];
    this.dropZones = [];
    this.currentItem = null;
    this.dragImage = null;
    this.onDragOverClass = "dragover";
    this._bound = {};
    this.touchInfo = null;
  }

  _refreshNodes() {
    this.items = Array.from(this.root.querySelectorAll(this.itemSelector));
    this.dropZones = Array.from(this.root.querySelectorAll(this.dropSelector));
    const baseStamp = Date.now();
    this.items.forEach((it, idx) => {
      if (!it.dataset.dragId)
        it.dataset.dragId = `draggable-${baseStamp}-${idx}`;
      // ensure draggable
      it.setAttribute("draggable", "true");
    });
  }

  init() {
    this._refreshNodes();
    this._bindDragEvents();
    this._bindDropZoneEvents();
    this._bindTouchFallback();
  }

  destroy() {
    // try to remove everything we bound
    this.items.forEach((item) => {
      item.removeEventListener("dragstart", this._bound.dragstart);
      item.removeEventListener("dragend", this._bound.dragend);
    });
    this.dropZones.forEach((z) => {
      z.removeEventListener("dragenter", this._bound.dragenter);
      z.removeEventListener("dragover", this._bound.dragover);
      z.removeEventListener("dragleave", this._bound.dragleave);
      z.removeEventListener("drop", this._bound.drop);
    });
    document.removeEventListener("dragover", this._bound.docDragOver);
    this.root.removeEventListener("touchstart", this._bound.touchstart);
    this.root.removeEventListener("touchmove", this._bound.touchmove);
    this.root.removeEventListener("touchend", this._bound.touchend);
  }

  _bindDragEvents() {
    this._bound.dragstart = (e) => {
      const item = e.currentTarget;
      this.currentItem = item;
      item.classList.add("dragging");
      try {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.dataset.dragId || "");
      } catch (err) {
        console.debug("dataTransfer.setData failed:", err);
      }

      const clone = item.cloneNode(true);
      clone.style.width = `${item.offsetWidth}px`;
      clone.style.boxShadow = "0 12px 30px rgba(6,8,20,0.12)";
      clone.style.opacity = "0.98";
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      document.body.appendChild(clone);
      try {
        e.dataTransfer.setDragImage(
          clone,
          Math.floor(item.offsetWidth / 2),
          Math.floor(item.offsetHeight / 2)
        );
      } catch (err) {}
      this.dragImage = clone;
      console.debug("dragstart", item.dataset.dragId);
    };

    this._bound.dragend = (e) => {
      if (this.currentItem) this.currentItem.classList.remove("dragging");
      if (this.dragImage && this.dragImage.parentNode)
        this.dragImage.parentNode.removeChild(this.dragImage);
      this.dragImage = null;
      this.currentItem = null;
      this.dropZones.forEach((z) => z.classList.remove(this.onDragOverClass));
      console.debug("dragend");
    };

    this._bound.docDragOver = (e) => {
      e.preventDefault();
    };

    this.items.forEach((item) => {
      item.addEventListener("dragstart", this._bound.dragstart);
      item.addEventListener("dragend", this._bound.dragend);
    });
    document.addEventListener("dragover", this._bound.docDragOver);
  }

  _bindDropZoneEvents() {
    this._bound.dragenter = (e) => {
      e.preventDefault();
      e.currentTarget.classList.add(this.onDragOverClass);
    };
    this._bound.dragover = (e) => {
      e.preventDefault();
      try {
        e.dataTransfer.dropEffect = "move";
      } catch (err) {}
    };
    this._bound.dragleave = (e) => {
      e.currentTarget.classList.remove(this.onDragOverClass);
    };

    this._bound.drop = (e) => {
      e.preventDefault();
      const zone = e.currentTarget;
      zone.classList.remove(this.onDragOverClass);

      let id = "";
      try {
        id =
          e.dataTransfer.getData("text/plain") ||
          e.dataTransfer.getData("application/x-item") ||
          "";
      } catch (err) {
        console.debug("getData failed:", err);
      }

      let dragged = null;
      if (id) {
        dragged = this.root.querySelector(`[data-drag-id="${id}"]`);
      }
      if (!dragged && this.currentItem) {
        dragged = this.currentItem;
      }
      if (!dragged) {
        dragged = this.root.querySelector(`${this.itemSelector}.dragging`);
      }

      if (!dragged) {
        console.debug("drop: could not locate dragged element (id=", id, ")");
        return;
      }

      if (zone.contains(dragged) && dragged.parentElement === zone) {
        // already inside this zone — do nothing
        console.debug("drop: item already inside drop zone");
        return;
      }

      try {
        zone.appendChild(dragged);
        dragged.setAttribute("draggable", "true");
        dragged.classList.remove("dragging");
        console.debug("drop: moved", dragged.dataset.dragId, "-> zone");
      } catch (err) {
        console.debug("drop append error", err);
      }
    };

    this.dropZones.forEach((z) => {
      z.addEventListener("dragenter", this._bound.dragenter);
      z.addEventListener("dragover", this._bound.dragover);
      z.addEventListener("dragleave", this._bound.dragleave);
      z.addEventListener("drop", this._bound.drop);
    });
  }

  _bindTouchFallback() {
    this._bound.touchstart = (e) => {
      const t = e.target.closest(this.itemSelector);
      if (!t) return;
      this.touchInfo = {
        node: t,
        startX: e.touches ? e.touches[0].clientX : e.clientX,
        startY: e.touches ? e.touches[0].clientY : e.clientY,
        clone: null,
        moved: false,
      };
      t.classList.add("dragging");
      const clone = t.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = `${this.touchInfo.startX - t.offsetWidth / 2}px`;
      clone.style.top = `${this.touchInfo.startY - t.offsetHeight / 2}px`;
      clone.style.pointerEvents = "none";
      clone.style.zIndex = 9999;
      clone.style.opacity = "0.98";
      document.body.appendChild(clone);
      this.touchInfo.clone = clone;
      this.currentItem = t;
    };

    this._bound.touchmove = (e) => {
      if (!this.touchInfo) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      this.touchInfo.moved = true;
      if (this.touchInfo.clone) {
        this.touchInfo.clone.style.left = `${
          x - this.touchInfo.node.offsetWidth / 2
        }px`;
        this.touchInfo.clone.style.top = `${
          y - this.touchInfo.node.offsetHeight / 2
        }px`;
      }
      const el = document.elementFromPoint(x, y);
      this.dropZones.forEach((z) =>
        z.classList.toggle(this.onDragOverClass, z === el || z.contains(el))
      );
      e.preventDefault();
    };

    this._bound.touchend = (e) => {
      if (!this.touchInfo) return;
      const last = e.changedTouches
        ? e.changedTouches[0]
        : (e.touches && e.touches[0]) || null;
      const x = last ? last.clientX : window.innerWidth / 2;
      const y = last ? last.clientY : window.innerHeight / 2;
      const under = document.elementFromPoint(x, y);
      const zone = this.dropZones.find((z) => z === under || z.contains(under));
      if (zone) {
        zone.appendChild(this.touchInfo.node);
      }
      if (this.touchInfo.clone && this.touchInfo.clone.parentNode)
        this.touchInfo.clone.parentNode.removeChild(this.touchInfo.clone);
      this.touchInfo.node.classList.remove("dragging");
      this.touchInfo = null;
      this.currentItem = null;
      this.dropZones.forEach((z) => z.classList.remove(this.onDragOverClass));
    };

    this.root.addEventListener(
      "touchstart",
      (e) => {
        const t = e.target.closest(this.itemSelector);
        if (!t) return;
        this._bound.touchstart(e);
      },
      { passive: false }
    );

    this.root.addEventListener("touchmove", this._bound.touchmove, {
      passive: false,
    });
    this.root.addEventListener("touchend", this._bound.touchend, {
      passive: false,
    });
  }
}
