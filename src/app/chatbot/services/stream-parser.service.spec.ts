import { TestBed } from '@angular/core/testing';
import { StreamParserService } from './stream-parser.service';

describe('StreamParserService', () => {
  let service: StreamParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreamParserService);
  });

  it('should parse NDJSON chunks', async () => {
    const chunks: string[] = [];

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"chunk","data":"Hello"}\n'));
        controller.enqueue(encoder.encode('{"type":"chunk","data":" World"}\n'));
        controller.enqueue(encoder.encode('{"type":"done"}\n'));
        controller.close();
      }
    });

    const response = new Response(stream);

    await service.parseNdjsonStream(response, (chunk) => chunks.push(chunk));

    expect(chunks).toEqual(['Hello', ' World']);
  });
});