import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import type { Response } from 'express';
import { describeRequestError } from '../payment/payment-errors';

// Safety net for any outgoing HTTP request that fails without being handled
// where it was made. Without this, Nest logs the entire AxiosError (thousands
// of lines, including request parameters) and answers the customer with a
// bare "Internal server error".
@Catch(AxiosError)
export class UpstreamErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('UpstreamError');

  catch(err: AxiosError, host: ArgumentsHost) {
    this.logger.error(`Outgoing request failed: ${describeRequestError(err)}`);
    host.switchToHttp().getResponse<Response>().status(502).json({
      statusCode: 502,
      error: 'Bad Gateway',
      code: 'UPSTREAM_UNAVAILABLE',
      message:
        'An external service is not responding. Please try again in a few minutes.',
    });
  }
}
