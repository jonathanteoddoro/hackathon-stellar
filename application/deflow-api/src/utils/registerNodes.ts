import * as fs from 'fs';
import * as path from 'path';
import { BaseNode, NodeFactory } from './NodeFactory';
import { NodeType } from './NodeType';
import { Logger } from '@nestjs/common';

// Mapeia os diretórios para as categorias de nós
const nodeDirectories: Record<string, NodeType> = {
  actions: NodeType.Action,
  loggers: NodeType.Logger,
  triggers: NodeType.Trigger,
};

/**
 * Varre os diretórios de nós, importa as classes e as registra no NodeFactory.
 * Isso é feito dinamicamente na inicialização para evitar importações manuais.
 */
export async function registerNodes() {
  const logger = new Logger('registerNodes');
  logger.log('Iniciando registro dinâmico de nós...');
  const basePath = path.join(__dirname, '..');

  for (const dir of Object.keys(nodeDirectories)) {
    const dirPath = path.join(basePath, dir);
    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        if (
          file.endsWith('.js') &&
          !file.endsWith('.spec.ts') &&
          !file.endsWith('.d.ts')
        ) {
          const modulePath = path.join(dirPath, file);
          const moduleName = path.basename(file, '.js');

          try {
            const module = (await import(modulePath)) as unknown;
            const NodeClass = (module as Record<string, unknown>)[moduleName];

            if (NodeClass && typeof NodeClass === 'function') {
              const category = nodeDirectories[dir];

              NodeFactory.register(
                moduleName,
                NodeClass as new (params: object) => BaseNode,
                category,
              );
              logger.log(
                `Nó '${moduleName}' registrado na categoria '${category}'.`,
              );
            }
          } catch (e) {
            logger.error(
              `Erro ao importar ou registrar o nó ${moduleName}:`,
              e,
            );
            throw new Error(
              `Falha ao registrar o nó ${moduleName} do arquivo ${file}.`,
            );
          }
        }
      }
    } catch (e: unknown) {
      void e;
      logger.warn(`Diretório de nós não encontrado: ${dirPath}`);
      throw new Error(`Falha ao ler o diretório de nós: ${dirPath}`);
    }
  }
  logger.log('Registro dinâmico de nós concluído.');
}
