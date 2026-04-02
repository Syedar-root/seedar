import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardRequest } from './create-dashboard.request';

export class UpdateDashboardRequest extends PartialType(
  CreateDashboardRequest,
) {}
