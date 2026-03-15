import { ApiClient } from './client.js';
import { RequestOptions } from '#pkg/seedar/types';
import {
  DashboardResponse,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  Layouts,
} from '#pkg/seedar/types';

export class DashboardApi {
  static async findAll(options?: RequestOptions): Promise<DashboardResponse[]> {
    return ApiClient.get<DashboardResponse[]>('/dashboard', options);
  }

  static async findOne(
    id: string,
    options?: RequestOptions
  ): Promise<DashboardResponse> {
    return ApiClient.get<DashboardResponse>(`/dashboard/${id}`, options);
  }

  static async create(
    data: CreateDashboardRequest,
    options?: RequestOptions
  ): Promise<DashboardResponse> {
    return ApiClient.post<DashboardResponse>('/dashboard', data, options);
  }

  static async update(
    id: string,
    data: UpdateDashboardRequest,
    options?: RequestOptions
  ): Promise<DashboardResponse> {
    return ApiClient.patch<DashboardResponse>(`/dashboard/${id}`, data, options);
  }

  static async remove(id: string, options?: RequestOptions): Promise<void> {
    return ApiClient.delete<void>(`/dashboard/${id}`, options);
  }

  static async updateLayout(
    id: string,
    layout: Layouts,
    options?: RequestOptions
  ): Promise<DashboardResponse> {
    return ApiClient.put<DashboardResponse>(`/dashboard/${id}/layout`, layout, options);
  }

  static async addPanel(
    id: string,
    panelId: string,
    options?: RequestOptions
  ): Promise<DashboardResponse> {
    return ApiClient.post<DashboardResponse>(
      `/dashboard/${id}/panels`,
      { panelId },
      options
    );
  }

  static async removePanel(
    id: string,
    panelId: string,
    options?: RequestOptions
  ): Promise<DashboardResponse> {
    return ApiClient.delete<DashboardResponse>(
      `/dashboard/${id}/panels/${panelId}`,
      options
    );
  }
}
