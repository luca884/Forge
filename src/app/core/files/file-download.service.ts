import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Time the blob URL stays alive after the click. Mobile Safari reads the blob
 * asynchronously and fails if the URL is revoked right away (same delay as FileSaver.js).
 */
export const REVOKE_DELAY_MS = 40_000;

/** UTF-8 byte order mark: makes spreadsheet apps (Excel) read accents correctly. */
const UTF8_BOM = '﻿';

/** FileDownloadService — saves text generated in the app as a file on the device. */
@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);

  downloadCsv(filename: string, content: string): void {
    this.download(filename, new Blob([UTF8_BOM, content], { type: 'text/csv;charset=utf-8' }));
  }

  /** No BOM: the file is read back by JSON.parse, not by a spreadsheet. */
  downloadJson(filename: string, content: string): void {
    this.download(filename, new Blob([content], { type: 'application/json;charset=utf-8' }));
  }

  private download(filename: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    // Some browsers ignore clicks on links that are not in the document.
    this.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  }
}
