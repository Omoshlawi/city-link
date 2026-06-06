/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import dayjs from 'dayjs';
import { Results } from './common.types';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';

type NullToUndefined<T> = T extends null
  ? undefined
  : T extends Array<infer U>
    ? Array<NullToUndefined<U>>
    : T extends object
      ? { [K in keyof T]: NullToUndefined<T[K]> }
      : T;

type SafeParseJsonOptions = {
  transformNullToUndefined?: boolean;
};

export class CommonUtils {
  static nullToUndefined<T>(input: T): NullToUndefined<T> {
    if (input === null) {
      return undefined as NullToUndefined<T>;
    }

    if (Array.isArray(input)) {
      return input.map((item) =>
        CommonUtils.nullToUndefined(item),
      ) as NullToUndefined<T>;
    }

    if (isPlainObject(input)) {
      return mapValues(input as object, (value) =>
        CommonUtils.nullToUndefined(value),
      ) as NullToUndefined<T>;
    }

    return input as NullToUndefined<T>;
  }

  static safeParseJson = <T, E = Error>(
    json: string,
    options: SafeParseJsonOptions = { transformNullToUndefined: false },
  ): Results<T, E> => {
    try {
      const data = JSON.parse(json);
      if (options.transformNullToUndefined) {
        return { success: true, data: CommonUtils.nullToUndefined(data) as T };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error as E };
    }
  };

  static parseDate(
    dateString: string | undefined | null,
    defaultNow: boolean = false,
  ) {
    const date = dayjs(dateString);
    if (dateString && date.isValid()) return date.toDate();
    if (defaultNow) return dayjs().toDate();
    return undefined;
  }

  static normalizeString(value: string) {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase()
      .normalize('NFD') // split accents
      .replace(/[\u0300-\u036f]/g, ''); // remove accents
  }
}
