class RadarMemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = 60000) {
    this.store.set(key, {
      value,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
      createdAt: Date.now(),
    });
    return value;
  }

  remember(key, ttlMs, loader) {
    const cached = this.get(key);
    if (cached) return Promise.resolve(cached);
    return Promise.resolve(loader()).then((value) => this.set(key, value, ttlMs));
  }

  getStale(key) {
    return this.store.get(key)?.value || null;
  }
}

module.exports = new RadarMemoryCache();
