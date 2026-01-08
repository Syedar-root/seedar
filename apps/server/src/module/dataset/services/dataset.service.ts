import { Inject, Injectable } from '@nestjs/common';
import { CreateDatasetRequest } from '../dto/create-dataset.request';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';
import { Dataset } from '../entities/dataset.entity';
import { DatasetTable } from '../entities/dataset-table.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasourceService } from '@/module/datasource/service/datasource.service';
import { DatasourceTableService } from '@/module/datasource/service/datasource-table.service';
import { DatasetStatus, DatasetType } from '../dataset.types';

@Injectable()
export class DatasetService {
  @InjectRepository(Dataset)
  private readonly datasetRepository!: Repository<Dataset>;

  @InjectRepository(DatasetTable)
  private readonly datasetTableRepository!: Repository<DatasetTable>;

  @Inject(DatasourceService)
  private readonly datasourceService!: DatasourceService;

  @Inject(DatasourceTableService)
  private readonly datasourceTableService!: DatasourceTableService;

  async create(request: CreateDatasetRequest) {
    // 验证数据源是否存在
    const datasource = await this.datasourceService.findOne(
      request.datasourceId,
    );

    if (!datasource) {
      throw new Error('数据源不存在');
    }

    // 获取选中的数据表
    const selectedTables = await Promise.all(
      request.datasourceTableIds.map((id) =>
        this.datasourceTableService.findOne(id),
      ),
    );

    // 检查所有表是否都存在
    const missingTables = selectedTables.filter((table) => !table);
    if (missingTables.length > 0) {
      throw new Error('部分数据表不存在');
    }

    // 创建数据集实体
    const dataset = this.datasetRepository.create({
      name: request.name,
      description: request.description,
      datasource: { id: datasource.id } as any, // 使用关系对象
      status: DatasetStatus.ACTIVE,
      type: DatasetType.SEMANTIC,
    });

    // 保存数据集
    const savedDataset = await this.datasetRepository.save(dataset);

    // 创建数据集表关联
    const datasetTables = selectedTables.map((table) => ({
      datasetId: savedDataset.id,
      tableId: table!.id,
      datasetName: savedDataset.name,
      tableName: table!.tableName,
    }));

    await this.datasetTableRepository.save(datasetTables);

    // 返回创建的数据集
    return savedDataset;
  }

  findAll() {
    return `This action returns all dataset`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dataset`;
  }

  update(id: number, updateDatasetDto: UpdateDatasetDto) {
    return `This action updates a #${id} dataset`;
  }

  remove(id: number) {
    return `This action removes a #${id} dataset`;
  }
}
