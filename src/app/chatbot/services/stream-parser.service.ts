import { Injectable } from '@angular/core';

/**
 * Parses newline-delimited JSON streaming responses from the FastAPI backend.
 */
@Injectable({ providedIn: 'root' })
export class StreamParserService {
  async parseNdjsonStream(
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!response.body) {
      throw new Error('Streaming response body is not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const result = await reader.read();
      if (result.done) break;

      buffer += decoder.decode(result.value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        this.processLine(line, onChunk);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      this.processLine(buffer, onChunk);
    }
  }

  private processLine(line: string, onChunk: (chunk: string) => void): void {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'chunk' && typeof parsed.data === 'string') {
        onChunk(parsed.data);
      }
    } catch {
      // Ignore malformed lines safely.
    }
  }
}