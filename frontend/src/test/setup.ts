import '@testing-library/jest-dom';

// Polyfill DataTransfer and ClipboardEvent for jsdom
if (typeof DataTransfer === 'undefined') {
  class DataTransferPolyfill {
    private _data: Map<string, string> = new Map();
    getData(format: string) { return this._data.get(format) ?? ''; }
    setData(format: string, data: string) { this._data.set(format, data); }
    clearData(format?: string) { format ? this._data.delete(format) : this._data.clear(); }
  }
  (global as Record<string, unknown>)['DataTransfer'] = DataTransferPolyfill;
}

if (typeof ClipboardEvent === 'undefined') {
  class ClipboardEventPolyfill extends Event {
    clipboardData: DataTransfer | null;
    constructor(type: string, init?: Record<string, unknown>) {
      const { clipboardData, ...rest } = init || {};
      super(type, { bubbles: true, cancelable: true, ...rest } as EventInit);
      this.clipboardData = (clipboardData as DataTransfer) ?? null;
    }
  }
  (global as Record<string, unknown>)['ClipboardEvent'] = ClipboardEventPolyfill;
}
