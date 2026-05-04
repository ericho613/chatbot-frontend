import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  ChatRequestPayload,
  GenerationConfig,
  RagRequestPayload
} from '../models/chatbot.models';
import { AuthTokenService } from './auth-token.service';
import { StreamParserService } from './stream-parser.service';

/**
 * Central service for communication with the FastAPI backend.
 * Uses HttpClient for non-streaming requests and fetch for streaming requests.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService,
    private streamParser: StreamParserService
  ) {}

  private getAuthHeadersJson(): HttpHeaders {
    const token = this.authTokenService.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private getFetchHeadersJson(): Headers {
    const token = this.authTokenService.getToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private getFetchHeadersForm(): Headers {
    const token = this.authTokenService.getToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  async basicChat(
    payload: ChatRequestPayload,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (payload.stream) {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: this.getFetchHeadersJson(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await this.extractErrorText(response));
      }

      let text = '';
      await this.streamParser.parseNdjsonStream(response, (chunk) => {
        text += chunk;
        onChunk?.(chunk);
      });
      return text;
    }

    const result = await firstValueFrom(
      this.http.post<{ success: boolean; model: string; response: string }>(
        `${this.baseUrl}/chat`,
        payload,
        { headers: this.getAuthHeadersJson() }
      )
    );

    return result.response;
  }

  async ragQuery(
    payload: RagRequestPayload,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (payload.stream) {
      const response = await fetch(`${this.baseUrl}/rag`, {
        method: 'POST',
        headers: this.getFetchHeadersJson(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await this.extractErrorText(response));
      }

      let text = '';
      await this.streamParser.parseNdjsonStream(response, (chunk) => {
        text += chunk;
        onChunk?.(chunk);
      });
      return text;
    }

    const result = await firstValueFrom(
      this.http.post<{ success: boolean; model: string; response: string }>(
        `${this.baseUrl}/rag`,
        payload,
        { headers: this.getAuthHeadersJson() }
      )
    );

    return result.response;
  }

  async summarizePdf(
    file: File,
    stream: boolean,
    language: 'English' | 'French',
    generationConfig: GenerationConfig,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('summary_language', language);
    form.append('stream', String(stream));
    form.append('generation_config', JSON.stringify(generationConfig));

    const response = await fetch(`${this.baseUrl}/pdf/summary`, {
      method: 'POST',
      headers: this.getFetchHeadersForm(),
      body: form
    });

    if (!response.ok) {
      throw new Error(await this.extractErrorText(response));
    }

    if (stream) {
      let text = '';
      await this.streamParser.parseNdjsonStream(response, (chunk) => {
        text += chunk;
        onChunk?.(chunk);
      });
      return text;
    }

    const json = await response.json();
    return json?.summary ?? '';
  }

  async generateCitation(
    file: File,
    style: 'APA' | 'MLA',
    stream: boolean,
    generationConfig: GenerationConfig,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('citation_style', style);
    form.append('stream', String(stream));
    form.append('generation_config', JSON.stringify(generationConfig));

    const response = await fetch(`${this.baseUrl}/pdf/citation`, {
      method: 'POST',
      headers: this.getFetchHeadersForm(),
      body: form
    });

    if (!response.ok) {
      throw new Error(await this.extractErrorText(response));
    }

    if (stream) {
      let text = '';
      await this.streamParser.parseNdjsonStream(response, (chunk) => {
        text += chunk;
        onChunk?.(chunk);
      });
      return text;
    }

    const json = await response.json();
    return json?.citation ?? '';
  }

  async uploadPdfToVectorDb(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);

    const response = await fetch(`${this.baseUrl}/pdf/upload`, {
      method: 'POST',
      headers: this.getFetchHeadersForm(),
      body: form
    });

    if (!response.ok) {
      throw new Error(await this.extractErrorText(response));
    }

    const json = await response.json();
    return `Uploaded "${json.filename}" successfully.`;
    // return `Indexed "${json.filename}" successfully. Citation: ${json.citation}. Chunks indexed: ${json.chunks_indexed}. Vector backend: ${json.vector_backend}.`;
  }

  private async extractErrorText(response: Response): Promise<string> {
    try {
      const json = await response.json();
      return json?.error || json?.detail || `Request failed with status ${response.status}`;
    } catch {
      return `Request failed with status ${response.status}`;
    }
  }
}