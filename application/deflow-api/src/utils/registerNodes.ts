import * as fs from 'fs';
import * as path from 'path';
import { BaseNode, NodeFactory } from './NodeFactory';
import { NodeType } from './NodeType';
import { Logger } from '@nestjs/common';
import { pathToFileURL } from 'url';

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

  // Tentativas em vários possíveis base paths (src/dist/runtime)
  const candidates = [
    path.join(__dirname, '..'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'src'),
    process.cwd(),
  ];

  for (const dir of Object.keys(nodeDirectories)) {
    const category = nodeDirectories[dir];
    let found = false;

    for (const basePath of candidates) {
      const dirPath = path.join(basePath, dir);
      if (!fs.existsSync(dirPath)) {
        logger.debug(`Diretório não existe: ${dirPath}`);
        continue;
      }

      found = true;
      let files: string[];
      try {
        files = fs.readdirSync(dirPath);
      } catch (e) {
        logger.warn(
          `Falha ao ler diretório: ${dirPath} - ${(e as Error).message}`,
        );
        continue;
      }

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!['.js', '.ts'].includes(ext)) continue;
        if (
          file.endsWith('.spec.ts') ||
          file.endsWith('.d.ts') ||
          file.endsWith('.map')
        )
          continue;

        const modulePath = path.join(dirPath, file);
        const moduleName = path.basename(file, ext);

        try {
          // On Windows the ESM loader requires file:// URLs for absolute paths
          const moduleUrl = pathToFileURL(modulePath).href;
          const mod = (await import(moduleUrl)) as Record<string, unknown>;
          const NodeClass = (mod[moduleName] ??
            (mod as unknown as { default: any }).default) as unknown;

          if (NodeClass && typeof NodeClass === 'function') {
            NodeFactory.register(
              moduleName,
              NodeClass as new (params: object) => BaseNode,
              category,
            );
            logger.log(
              `Nó '${moduleName}' registrado na categoria '${category}'.`,
            );
          } else {
            logger.debug(
              `Export '${moduleName}' não encontrado em ${modulePath}`,
            );
          }
        } catch (e) {
          logger.error(
            `Erro ao importar ou registrar o nó ${moduleName}:`,
            (e as Error).stack ?? e,
          );
          // continue processing other files instead of aborting startup
        }
      }

      // processed this existing candidate dir for this category
      break;
    }

    if (!found) {
      logger.warn(
        `Diretório de nós não encontrado para categoria '${dir}'. Procurados: ${candidates
          .map((p) => path.join(p, dir))
          .join(', ')}`,
      );
      // do not throw — allow app to continue even if some categories are missing
    }
  }

  logger.log('Registro dinâmico de nós concluído.');
}
