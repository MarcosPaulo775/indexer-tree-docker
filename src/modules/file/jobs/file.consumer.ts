import { Processor, Process, OnQueueCompleted } from '@nestjs/bull';
import { Job } from 'bull';

import { UrlService } from '@shared/services/url/url.service';

import config from '../../../config';
import { FileService } from '../file.service';
import { FileDto } from '../models/file.dto';

@Processor('fileIndexer')
export class FileConsumer {
  constructor(
    private fileService: FileService,
    private urlService: UrlService
  ) {}

  @Process('addFile')
  async addFile(job: Job<string>) {
    const url = job.data;
    try {
      if (url !== config.filesDirectory) {
        const { name, path } = this.urlService.extractUrlInformation(url);
        const file = await this.fileService.isIndexed(name, path);
        if (!file) {
          await this.fileService.create(new FileDto(name, path, false));
          return `Arquivo ${path.join('/')} adicionado com sucesso!`;
        }
        return `Arquivo ${path.join('/')} já existe!`;
      }
      return 'Raiz do projeto ignorada!';
    } catch {
      throw new Error();
    }
  }

  @Process('addDir')
  async addDir(job: Job<string>) {
    const url = job.data;

    try {
      if (url !== config.filesDirectory) {
        const { name, path } = this.urlService.extractUrlInformation(url);
        const file = await this.fileService.isIndexed(name, path);
        if (!file) {
          await this.fileService.create(new FileDto(name, path, true));
          return `Pasta ${path.join('/')} adicionado com sucesso!`;
        }
        return `Pasta ${path.join('/')} já existe!`;
      }
      return 'Raiz do projeto ignorada!';
    } catch {
      throw new Error();
    }
  }

  @Process('unlinkFile')
  async unlinkFile(job: Job<string>) {
    const url = job.data;
    try {
      const { name, path } = this.urlService.extractUrlInformation(url);
      const file = await this.fileService.findOneByNameAndPathAndIsDirectory(
        name,
        path,
        false
      );
      if (file) {
        const resp = await this.fileService.delete(file._id);
        if (resp) {
          return `Arquivo ${path.join('/')} deletado com sucesso!`;
        }
        return `Erro ao deletar arquivo ${path.join('/')}!`;
      }
      return `Arquivo ${path.join('/')} inexistente!`;
    } catch {
      throw new Error();
    }
  }

  @Process('unlinkDir')
  async unlinkDir(job: Job<string>) {
    const url = job.data;
    try {
      const { name, path } = this.urlService.extractUrlInformation(url);
      const file = await this.fileService.findOneByNameAndPathAndIsDirectory(
        name,
        path,
        true
      );
      if (file) {
        const resp = await this.fileService.delete(file._id);
        if (resp) {
          return `Pasta ${path.join('/')} deletada com sucesso!`;
        }
        return `Erro ao deletar pasta ${path.join('/')}!`;
      }
      return `Pasta ${path.join('/')} inexistente!`;
    } catch (e) {
      throw new Error(e);
    }
  }

  @OnQueueCompleted()
  onInit(job: Job<string>) {
    console.log(
      `Completed job ${job.id} of type ${job.name} with data ${job.data}...`
    );
  }
}
