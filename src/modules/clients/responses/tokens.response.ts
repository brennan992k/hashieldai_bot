import { BaseResponse } from 'src/common/response';

export class TokensResponse extends BaseResponse<{
  address: string;
  token: string;
  expiredAt: number;
}> {}
