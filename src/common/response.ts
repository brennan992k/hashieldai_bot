export class ResponseError {
  readonly message: string;

  readonly property?: string;
}

export class SystemVersionInfo {
  readonly name: string;

  readonly code: string;

  readonly path: string;
}

export class SystemInfo {
  readonly name: string;

  readonly mode: string;

  readonly version: SystemVersionInfo;
}

export class BaseResponse<T> {
  readonly status: boolean;

  readonly data?: T;

  readonly error?: ResponseError | null | undefined;

  readonly system?: SystemInfo;
}

export class UpdateResponse extends BaseResponse<null> {}

export class DeleteResponse extends BaseResponse<null> {}

export class PaginationResponse<T> extends BaseResponse<Array<T>> {
  readonly data: Array<T> | undefined | null;

  readonly limit?: number | undefined | null;

  readonly page?: number | undefined | null;

  readonly next_page?: number | undefined | null;

  readonly prev_page?: number | undefined | null;

  readonly total?: number | undefined | null;

  readonly total_page?: number | undefined | null;
}
