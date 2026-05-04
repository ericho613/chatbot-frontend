import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import createDOMPurify, { DOMPurify } from 'dompurify';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly isBrowser: boolean;
  private purifier: DOMPurify | null = null;
  private serverPurifierLoading: Promise<void> | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    marked.setOptions({
      gfm: true,
      breaks: true
    });

    if (this.isBrowser) {
      this.initializeBrowserPurifier();
    } else {
      this.initializeServerPurifierLazily();
    }
  }

  render(content: string): SafeHtml {
    const rawHtml = marked.parse(content || '') as string;

    const sanitizedHtml = this.purifier
      ? this.sanitizeWithPurifier(rawHtml)
      : this.basicFallbackSanitize(rawHtml);

    const finalHtml = this.enforceSafeLinks(sanitizedHtml);
    return this.sanitizer.bypassSecurityTrustHtml(finalHtml);
  }

  private initializeBrowserPurifier(): void {
    if (typeof window === 'undefined') return;
    this.purifier = createDOMPurify(window);
  }

  private initializeServerPurifierLazily(): void {
    if (this.serverPurifierLoading) return;

    this.serverPurifierLoading = this.loadServerPurifier().catch(() => {
      this.purifier = null;
    });
  }

  private async loadServerPurifier(): Promise<void> {
    const jsdomModule = await import('jsdom');
    const { JSDOM } = jsdomModule;

    const windowLike: any = new JSDOM('').window as unknown as Window;
    this.purifier = createDOMPurify(windowLike);
  }

  private sanitizeWithPurifier(html: string): string {
    if (!this.purifier) {
      return this.basicFallbackSanitize(html);
    }

    return this.purifier.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'a', 'p', 'br', 'strong', 'em', 'code', 'pre',
        'blockquote', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel']
    }) as string;
  }

  private basicFallbackSanitize(html: string): string {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/\sjavascript:/gi, '')
      .replace(/\sdata:/gi, '');
  }

  private enforceSafeLinks(html: string): string {
    return this.isBrowser
      ? this.enforceSafeLinksBrowser(html)
      : this.enforceSafeLinksServer(html);
  }

  private enforceSafeLinksBrowser(html: string): string {
    if (typeof DOMParser === 'undefined') {
      return html;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('a').forEach(anchor => {
      const href = anchor.getAttribute('href') || '';

      if (!this.isSafeHref(href)) {
        anchor.removeAttribute('href');
      }

      if (this.isExternalHref(href)) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      } else {
        anchor.removeAttribute('target');
        anchor.removeAttribute('rel');
      }
    });

    return doc.body.innerHTML;
  }

  private enforceSafeLinksServer(html: string): string {
    return html.replace(/<a\b([^>]*)>/gi, (fullMatch, attrs) => {
      const hrefMatch = attrs.match(/\bhref=(["'])(.*?)\1/i);
      const href = hrefMatch?.[2] || '';

      let safeAttrs = attrs;

      if (!this.isSafeHref(href)) {
        safeAttrs = safeAttrs.replace(/\s*href=(["'])(.*?)\1/i, '');
      }

      safeAttrs = safeAttrs
        .replace(/\s*target=(["'])(.*?)\1/i, '')
        .replace(/\s*rel=(["'])(.*?)\1/i, '');

      if (this.isExternalHref(href) && this.isSafeHref(href)) {
        safeAttrs = `${safeAttrs} target="_blank" rel="noopener noreferrer"`;
      }

      return `<a${safeAttrs}>`;
    });
  }

  private isSafeHref(href: string): boolean {
    const normalized = (href || '').trim().toLowerCase();

    return (
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('mailto:') ||
      normalized.startsWith('#') ||
      normalized.startsWith('/')
    );
  }

  private isExternalHref(href: string): boolean {
    const normalized = (href || '').trim().toLowerCase();
    return (
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('mailto:')
    );
  }
}