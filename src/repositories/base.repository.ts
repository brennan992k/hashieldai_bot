import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type CreateAxiosDefaults,
} from 'axios';

interface RequestOptions {
  params?: object;
  data?: any;
  headers?: object;
}

export abstract class BaseRepository {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
    });
  }

  public setConfig(config: CreateAxiosDefaults) {
    if (config.baseURL) this.client.defaults.baseURL = config.baseURL;
  }

  public async get(endpoint: string, options?: RequestOptions): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get(endpoint, options);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get data from ${endpoint}: ${
          (error as { message: string }).message
        }`,
      );
    }
  }

  public async post(
    endpoint: string,
    data: any,
    options?: RequestOptions,
  ): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.post(
        endpoint,
        data,
        options,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to post data to ${endpoint}: ${
          (error as { message: string }).message
        }`,
      );
    }
  }

  public async patch(
    endpoint: string,
    data: any,
    options?: RequestOptions,
  ): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.patch(
        endpoint,
        data,
        options,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to post data to ${endpoint}: ${
          (error as { message: string }).message
        }`,
      );
    }
  }

  public async delete(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.delete(
        endpoint,
        options,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to post data to ${endpoint}: ${
          (error as { message: string }).message
        }`,
      );
    }
  }
}
