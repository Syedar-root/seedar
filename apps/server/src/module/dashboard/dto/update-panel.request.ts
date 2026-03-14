import { PartialType } from '@nestjs/mapped-types';
import { CreatePanelRequest } from './create-panel.request';

export class UpdatePanelRequest extends PartialType(CreatePanelRequest) {}
