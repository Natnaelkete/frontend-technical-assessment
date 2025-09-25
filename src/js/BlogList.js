export class BlogList {
  constructor(container) {
    this.container = container;
    this.listContainer = container.querySelector(".blog-list-content");
    this.loadingIndicator = container.querySelector(".loading-indicator");
    this.errorContainer = container.querySelector(".error-container");

    this.sortSelect = container.querySelector(".sort-select");
    this.filterSelect = container.querySelector(".filter-select");
    this.searchInput = container.querySelector(".search-input");

    this.apiUrl = "https://frontend-blog-lyart.vercel.app/blogsData.json";
    this.items = [];
    this.filteredItems = [];
    this.page = 1;
    this.perPage = 10;

    this.onSortChange = this.onSortChange.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onSearchInput = this.onSearchInput.bind(this);
  }

  async init() {
    try {
      this.showLoading();
      await this.fetchData();
      this.setupEventListeners();
      this.applyFilters();
    } catch (err) {
      this.showError(err);
    } finally {
      this.hideLoading();
    }
  }

  async fetchData() {
    // caching
    const cacheKey = "blogs_cache";
    const cached = localStorage.getItem(cacheKey);
    const cacheExpiry = 5 * 60 * 1000;

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheExpiry) {
        this.items = data;
        this.filteredItems = [...data];
        return;
      }
    }

    // retry fetch
    let attempts = 0;
    let success = false;
    let data = null;
    while (attempts < 3 && !success) {
      try {
        const res = await fetch(this.apiUrl);
        if (!res.ok) throw new Error("Failed to fetch blogs");
        data = await res.json();
        if (!Array.isArray(data)) throw new Error("Unexpected API response");
        success = true;
      } catch (err) {
        attempts++;
        if (attempts >= 3) throw err;
      }
    }

    this.items = data;
    this.filteredItems = [...data];
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  }

  setupEventListeners() {
    this.sortSelect?.addEventListener("change", this.onSortChange);
    this.filterSelect?.addEventListener("change", this.onFilterChange);
    let t;
    this.searchInput?.addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => this.onSearchInput(e), 250);
    });
  }

  applyFilters() {
    let list = [...this.items];

    const q = this.searchInput?.value.trim().toLowerCase() || "";
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.content && b.content.toLowerCase().includes(q))
      );
    }

    const category = this.filterSelect?.value || "";
    if (category) {
      list = list.filter(
        (b) =>
          (b.category && b.category.toLowerCase() === category.toLowerCase()) ||
          (b.tags &&
            b.tags.some((t) => t.toLowerCase() === category.toLowerCase()))
      );
    }

    const sortBy = this.sortSelect?.value;
    if (sortBy === "date") {
      list.sort(
        (a, b) => new Date(b.published_date) - new Date(a.published_date)
      );
    } else if (sortBy === "reading_time") {
      list.sort(
        (a, b) =>
          this.parseReadingTime(a.reading_time) -
          this.parseReadingTime(b.reading_time)
      );
    } else if (sortBy === "category") {
      list.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    }

    this.filteredItems = list;
    this.page = 1;
    this.render();
  }

  parseReadingTime(text) {
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  render() {
    const slice = this.filteredItems.slice(0, this.perPage);
    if (!slice.length) {
      this.listContainer.innerHTML = `<p class="no-results">No blogs found</p>`;
      return;
    }

    this.listContainer.innerHTML = slice
      .map(
        (b) => `
      <article class="blog-item">
        <img src="${b.image}" alt="${b.title}" class="blog-image"/>
        <div class="blog-content">
          <h3 class="blog-title">${b.title}</h3>
          <div class="blog-meta">
            <span class="blog-author">${b.author}</span>
            <time class="blog-date">${new Date(
              b.published_date
            ).toLocaleDateString()}</time>
            <span class="blog-reading-time">${b.reading_time}</span>
            <span class="blog-category">${b.category}</span>
          </div>
          <p class="blog-excerpt">${b.content}</p>
          <div class="blog-tags">${(b.tags || [])
            .map((t) => `<span class="tag">${t}</span>`)
            .join("")}</div>
        </div>
      </article>
    `
      )
      .join("");
  }

  onSortChange(e) {
    this.applyFilters();
  }

  onFilterChange(e) {
    this.applyFilters();
  }

  onSearchInput(e) {
    this.applyFilters();
  }

  showLoading() {
    this.loadingIndicator?.classList.remove("hidden");
  }

  hideLoading() {
    this.loadingIndicator?.classList.add("hidden");
  }

  showError(err) {
    if (!this.errorContainer) return;
    this.errorContainer.classList.remove("hidden");
    this.errorContainer.textContent = `Error: ${err.message}`;
  }
}
