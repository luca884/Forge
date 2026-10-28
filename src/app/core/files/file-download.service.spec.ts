import { TestBed } from '@angular/core/testing';

import { FileDownloadService, REVOKE_DELAY_MS } from './file-download.service';

function readBytes(blob: Blob): Promise<number[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
    reader.readAsArrayBuffer(blob);
  });
}

function readText(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
}

describe('FileDownloadService', () => {
  // jsdom has no blob URLs: install fakes and put back whatever was there.
  const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let clicked: { download: string; href: string; inDocument: boolean }[];

  function restore(name: 'createObjectURL' | 'revokeObjectURL', descriptor: PropertyDescriptor | undefined): void {
    if (descriptor) Object.defineProperty(URL, name, descriptor);
    else delete (URL as unknown as Record<string, unknown>)[name];
  }

  beforeEach(() => {
    createObjectURL = jest.fn().mockReturnValue('blob:forge');
    revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true, writable: true });
    clicked = [];
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ download: this.download, href: this.getAttribute('href') ?? '', inDocument: this.isConnected });
    });
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    restore('createObjectURL', originalCreate);
    restore('revokeObjectURL', originalRevoke);
    jest.restoreAllMocks();
    jest.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('saves the CSV as UTF-8 with a BOM, so spreadsheet apps keep the accents', async () => {
    TestBed.inject(FileDownloadService).downloadCsv('forge-historial-2026-10-28.csv', 'ejercicio\r\nPress inclinado, mancuernas\r\n');

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8');
    const bytes = await readBytes(blob);
    expect(bytes.slice(0, 3)).toEqual([0xef, 0xbb, 0xbf]);
    expect(await readText(blob.slice(3))).toBe('ejercicio\r\nPress inclinado, mancuernas\r\n');
  });

  it('clicks a link with the file name and leaves no link behind', () => {
    TestBed.inject(FileDownloadService).downloadCsv('forge-historial-2026-10-28.csv', 'x\r\n');

    expect(clicked).toEqual([{ download: 'forge-historial-2026-10-28.csv', href: 'blob:forge', inDocument: true }]);
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('frees the blob URL only after a delay, so mobile browsers can finish the download', () => {
    jest.useFakeTimers();
    TestBed.inject(FileDownloadService).downloadCsv('f.csv', 'x\r\n');

    jest.advanceTimersByTime(REVOKE_DELAY_MS - 1);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:forge');
  });
});
