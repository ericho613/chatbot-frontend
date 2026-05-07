import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { marked } from 'marked';
import createDOMPurify, { DOMPurify } from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true
});

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly isBrowser: boolean;
  private purifier: DOMPurify | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    marked.setOptions({
      gfm: true,
      breaks: true
    });

    if (this.isBrowser && typeof window !== 'undefined') {
      this.purifier = createDOMPurify(window);
    }
  }

  render(content: string | null | undefined): string {
    const markdown = content ?? '';
    const rawHtml = marked.parse(markdown) as string;

    const sanitizedHtml = this.purifier
      ? this.sanitizeWithDomPurify(rawHtml)
      : this.sanitizeServerFallback(rawHtml);

    return this.enforceSafeLinks(sanitizedHtml);
  }

  private sanitizeWithDomPurify(html: string): string {
    if (!this.purifier) {
      return this.sanitizeServerFallback(html);
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

  private sanitizeServerFallback(html: string): string {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[\s\S]*?>/gi, '')
      .replace(/<form[\s\S]*?>[\s\S]*?<\/form>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/\son\w+=\S+/gi, '')
      .replace(/\sstyle=(["']).*?\1/gi, '')
      .replace(/\sstyle=\S+/gi, '')
      .replace(/\s(href|src)=(["'])\s*(javascript|data|vbscript):.*?\2/gi, '')
      .replace(/\s(href|src)=\s*(javascript|data|vbscript):\S+/gi, '');
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
    return html.replace(/<a\b([^>]*)>/gi, (_match, attrs) => {
      const hrefMatch = attrs.match(/\bhref=(["'])(.*?)\1/i);
      const href = hrefMatch?.[2] || '';

      let safeAttrs = attrs;

      safeAttrs = safeAttrs
        .replace(/\s*target=(["'])(.*?)\1/gi, '')
        .replace(/\s*rel=(["'])(.*?)\1/gi, '');

      if (!this.isSafeHref(href)) {
        safeAttrs = safeAttrs.replace(/\s*href=(["'])(.*?)\1/gi, '');
      }

      if (this.isExternalHref(href) && this.isSafeHref(href)) {
        safeAttrs = `${safeAttrs} target="_blank" rel="noopener noreferrer"`;
      }

      return `<a${safeAttrs}>`;
    });
  }

  private isSafeHref(href: string): boolean {
    const normalized = href.trim().toLowerCase();

    return (
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('mailto:') ||
      normalized.startsWith('#') ||
      normalized.startsWith('/')
    );
  }

  private isExternalHref(href: string): boolean {
    const normalized = href.trim().toLowerCase();

    return (
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('mailto:')
    );
  }
}