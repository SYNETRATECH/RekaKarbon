import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
  Type,
  Provider,
} from '@nestjs/common';
import request from 'supertest';
import type { Request } from 'express';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import type { AuthenticatedUserPayload } from '../../auth/types';
import type { ApiResponse, ApiErrorResponse } from '../types';
import { type ZodType } from 'zod';

export interface HarnessOptions {
  controllers: Type<unknown>[];
  providers?: Provider[];
  currentUser?: AuthenticatedUserPayload;
  bypassAuth?: boolean;
}

export interface ContractTestHarness {
  app: INestApplication;
  module: TestingModule;
  http: ReturnType<typeof request>;
  close: () => Promise<void>;
}

export function getResponseBody<T = unknown>(
  res: request.Response,
): ApiResponse<T> {
  return res.body as ApiResponse<T>;
}

export function getResponseError(res: request.Response): ApiErrorResponse {
  return res.body as ApiErrorResponse;
}

interface ExpressAuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

export async function createContractTestHarness(
  options: HarnessOptions,
): Promise<ContractTestHarness> {
  const defaultUser: AuthenticatedUserPayload = options.currentUser ?? {
    userId: '00000000-0000-4000-8000-000000000001',
    email: 'admin@rekakarbon.id',
    role: Role.superadmin,
  };

  const moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
    controllers: options.controllers,
    providers: options.providers ?? [],
  });

  if (options.bypassAuth !== false) {
    moduleBuilder
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<ExpressAuthenticatedRequest>();
          req.user = defaultUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      });
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();
  const app: INestApplication = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  const server = app.getHttpServer() as Parameters<typeof request>[0];

  return {
    app,
    module: moduleFixture,
    http: request(server),
    close: async () => {
      await app.close();
    },
  };
}

/**
 * Asserts that the response payload strictly satisfies the provided Zod schema.
 */
export function expectContract<T>(
  responseBody: unknown,
  schema: ZodType<T>,
): T {
  if (
    !responseBody ||
    typeof responseBody !== 'object' ||
    !('success' in responseBody) ||
    !('data' in responseBody)
  ) {
    throw new Error(
      `Response does not conform to standard { success: true, data: T } envelope:\n${JSON.stringify(responseBody, null, 2)}`,
    );
  }

  const envelope = responseBody as { success: boolean; data: unknown };
  if (envelope.success !== true) {
    throw new Error(
      `Response envelope reported failure (success !== true):\n${JSON.stringify(responseBody, null, 2)}`,
    );
  }

  const parseResult = schema.safeParse(envelope.data);
  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    const formatted = issues
      .map(
        (i) =>
          `  - [${i.path.join('.') || 'root'}]: ${i.message} (received: ${JSON.stringify((i as unknown as { received?: unknown }).received)})`,
      )
      .join('\n');
    throw new Error(
      `API Contract Validation Failed! Client Zod Schema rejected backend response:\n${formatted}\n\nPayload:\n${JSON.stringify(envelope.data, null, 2)}`,
    );
  }

  return parseResult.data;
}
