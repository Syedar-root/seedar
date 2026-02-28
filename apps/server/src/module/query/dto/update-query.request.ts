import { PartialType } from '@nestjs/mapped-types';
import { CreateQueryRequest } from './create-query.request';

export class UpdateQueryRequest extends PartialType(CreateQueryRequest) {}
