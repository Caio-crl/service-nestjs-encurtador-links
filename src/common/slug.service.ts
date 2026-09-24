import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';

const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SLUG_LENGTH = 6;

@Injectable()
export class SlugService {
  generate(): string {
    return Array.from(
      { length: SLUG_LENGTH },
      () => ALPHABET[randomInt(ALPHABET.length)],
    ).join('');
  }
}
