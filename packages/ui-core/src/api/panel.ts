import { ApiClient } from './client.js';
import { RequestOptions } from '#pkg/seedar/types';
import {
  PanelResponse,
  CreatePanelRequest,
  UpdatePanelRequest,
} from '#pkg/seedar/types';

export class PanelApi {
  static async findAll(options?: RequestOptions): Promise<PanelResponse[]> {
    return ApiClient.get<PanelResponse[]>('/panel', options);
  }

  static async findOne(
    id: string,
    options?: RequestOptions
  ): Promise<PanelResponse> {
    return ApiClient.get<PanelResponse>(`/panel/${id}`, options);
  }

  static async create(
    data: CreatePanelRequest,
    options?: RequestOptions
  ): Promise<PanelResponse> {
    return ApiClient.post<PanelResponse>('/panel', data, options);
  }

  static async update(
    id: string,
    data: UpdatePanelRequest,
    options?: RequestOptions
  ): Promise<PanelResponse> {
    return ApiClient.patch<PanelResponse>(`/panel/${id}`, data, options);
  }

  static async remove(id: string, options?: RequestOptions): Promise<void> {
    return ApiClient.delete<void>(`/panel/${id}`, options);
  }
}
