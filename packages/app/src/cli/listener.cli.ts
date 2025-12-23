import { addListener, deleteListener, updateListener } from '#infrastructure/listeners';
import { Command } from 'commander';
import { logger } from '@crawlers/base';

const listenerCli = new Command();

listenerCli.name('listener')
  .description('CLI to handle @crawlers/listeners')
  .version('1.0.0');

listenerCli.command('add')
  .description('Register a new listener')
  .requiredOption('-n, --name <name>', 'Listener Name')
  .requiredOption('-u, --url <url>', 'Listener Url')
  .requiredOption('-a, --authentication <authentication>', 'Authentication Key')
  .action(async (params) => {
    logger.info('Registering a new listener');
    const result = await addListener(params.name, params.url, params.authentication);
    logger.info({ result }, 'Listener registered');
  });

listenerCli.command('rm')
  .description('Remove an existing listener')
  .requiredOption('-i, --id <id>', 'Listener ID')
  .action(async (params) => {
    logger.info('Deleting an existing listener');
    const result = await deleteListener(params.id);
    logger.info({ result }, 'Listener deleted');
  });

listenerCli.command('update')
  .description('Updating an existing listener')
  .requiredOption('-i, --id <id>', 'Listener ID')
  .option('-n, --name <name>', 'Listener Name')
  .option('-u, --url <url>', 'Listener Url')
  .option('-a, --authentication <authentication>', 'Authentication Key')
  .action(async (params) => {
    logger.info('Updating an existing listener');
    const result = await updateListener(params.id, params.name, params.url, params.authentication);
    logger.info({ result }, 'Listener updated');
  });

export { listenerCli };
