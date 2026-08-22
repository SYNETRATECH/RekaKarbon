import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

function sanitizePayload(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  if (Array.isArray(body)) return body.map(sanitizePayload);

  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'refreshtoken',
    'accesstoken',
    'apikey',
  ];

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const method = req.method;
    const originalUrl = req.originalUrl;
    const rawBody: unknown = req.body;
    const startTime = Date.now();

    const hasBody =
      typeof rawBody === 'object' &&
      rawBody !== null &&
      Object.keys(rawBody).length > 0;
    const bodyStr = hasBody
      ? ` | Body: ${JSON.stringify(sanitizePayload(rawBody))}`
      : '';

    this.logger.log(`📥 [HTTP IN] ${method} ${originalUrl}${bodyStr}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        this.logger.log(
          `📤 [HTTP OUT] ${method} ${originalUrl} ${statusCode} +${duration}ms`,
        );
      }),
    );
  }
}
