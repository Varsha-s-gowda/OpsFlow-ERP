import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import config from '../config';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (err.code === 'P2002') {
      message = `Duplicate field value: ${err.meta?.target || 'unique constraint failed'}`;
    } else {
      message = `Database error: ${err.message}`;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation failed';
  } else if (err.status || err.statusCode) {
    statusCode = err.status || err.statusCode;
    message = err.message || message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  const response: any = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (config.NODE_ENV === 'development' && !(err instanceof ZodError)) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
export default errorHandler;
