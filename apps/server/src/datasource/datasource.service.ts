import { Injectable } from '@nestjs/common';
import { CreateDatasourceDto } from './dto/create-datasource.dto';
import { UpdateDatasourceDto } from './dto/update-datasource.dto';

@Injectable()
export class DatasourceService {
  create(createDatasourceDto: CreateDatasourceDto) {
    return 'This action adds a new datasource';
  }

  findAll() {
    return `This action returns all datasource`;
  }

  findOne(id: number) {
    return `This action returns a #${id} datasource`;
  }

  update(id: number, updateDatasourceDto: UpdateDatasourceDto) {
    return `This action updates a #${id} datasource`;
  }

  remove(id: number) {
    return `This action removes a #${id} datasource`;
  }
}
