import { PartialType } from '@nestjs/mapped-types';
import { CreateDatasetRequest } from './create-dataset.request';

export class UpdateDatasetDto extends PartialType(CreateDatasetRequest) {}
