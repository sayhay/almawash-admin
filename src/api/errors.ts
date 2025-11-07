import axios, { type AxiosError } from 'axios';

export type ApiErrorBody = {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  path?: string;
  method?: string;
  errors?: Record<string, string>;
  requestId?: string;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, string>;
  requestId?: string;

  constructor(message: string, init?: { status?: number; code?: string; details?: Record<string, string>; requestId?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = init?.status;
    this.code = init?.code;
    this.details = init?.details;
    this.requestId = init?.requestId;
  }
}

const extractErrorBody = (error: AxiosError): ApiErrorBody | undefined => {
  const data = error.response?.data;
  if (!data) {
    return undefined;
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as ApiErrorBody;
    } catch (parseError) {
      return { message: data };
    }
  }
  if (typeof data === 'object') {
    return data as ApiErrorBody;
  }
  return undefined;
};

export const parseAxiosError = (err: unknown): ApiError => {
  if (err instanceof ApiError) {
    return err;
  }

  if (axios.isAxiosError(err)) {
    const body = extractErrorBody(err);
    const status = err.response?.status ?? body?.status;
    const code = body?.code ?? (err.code as string | undefined);
    const message = body?.message ?? err.message ?? 'Une erreur est survenue';
    const details = body?.errors;
    const requestId = body?.requestId ?? (err.response?.headers?.['x-request-id'] as string | undefined);

    return new ApiError(message, { status, code, details, requestId });
  }

  if (err instanceof Error) {
    return new ApiError(err.message);
  }

  return new ApiError('Une erreur réseau est survenue');
};
