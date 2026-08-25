import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected server error occurred.';
    let details: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        const respError = resp.error;

        if (typeof respError === 'object' && respError !== null) {
          const errObj = respError as Record<string, unknown>;
          if (typeof errObj.code === 'string') errorCode = errObj.code;
          if (typeof errObj.message === 'string') errorMessage = errObj.message;
          if (typeof errObj.details === 'object') {
            details = errObj.details as Record<string, string[]>;
          }
        } else {
          if (typeof resp.message === 'string') {
            errorMessage = resp.message;
          } else if (Array.isArray(resp.message)) {
            details = { validation: resp.message as string[] };
            errorMessage = 'Validation failed for one or more fields.';
          }
          if (typeof resp.error === 'string') {
            errorCode = resp.error;
          } else {
            errorCode = `HTTP_${status}`;
          }
        }
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;

      // Detect database connection & authentication failures
      if (
        exception.message.includes('Authentication failed') ||
        exception.message.includes('Server has closed the connection') ||
        exception.message.includes("Can't reach database server")
      ) {
        errorCode = 'DATABASE_CONNECTION_ERROR';
        errorMessage =
          'Unable to connect to PostgreSQL database. Please check your DATABASE_URL credentials in server/.env.';
      }

      this.logger.error(
        `Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        ...(details ? { details } : {}),
      },
    };

    response.status(status).json(errorPayload);
  }
}
