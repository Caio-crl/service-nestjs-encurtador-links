import { ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { MyExceptionFilter } from './myexception.filter';

describe('MyExceptionFilter', () => {
  it('does not expose database details in a 500 response', async () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', path: '/links' }),
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    const error = new QueryFailedError(
      'INSERT INTO links',
      [],
      new Error('secret'),
    );

    await new MyExceptionFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
