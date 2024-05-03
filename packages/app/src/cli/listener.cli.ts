import { addListener, deleteListener, updateListener } from '#infrastructure/listeners';
import { Command } from 'commander';

const listenerCli = new Command();

listenerCli.name('listener')
  .description('CLI to handle @crawlers/listeners')
  .version('1.0.0');

listenerCli.command('add')
  .description('Register a new listener')
  .requiredOption('-n, --name <name>', 'Listener Name')
  .requiredOption('-u, --url <url>', 'Listener Url')
  .action(async (params) => {
    console.log('Registering a new listener');
    const result = await addListener(params.name, params.url);
    console.log(result);
  });

listenerCli.command('rm')
  .description('Remove an existing listener')
  .requiredOption('-i, --id <id>', 'Listener ID')
  .action(async (params) => {
    console.log('Deleting an existing listener');
    const result = await deleteListener(params.id);
    console.log(result);
  });

listenerCli.command('update')
  .description('Updating an existing listener')
  .requiredOption('-i, --id <id>', 'Listener ID')
  .option('-n, --name <name>', 'Listener Name')
  .option('-u, --url <url>', 'Listener Url')
  .action(async (params) => {
    console.log('Updating an existing listener');
    const result = await updateListener(params.id, params.name, params.url);
    console.log(result);
  });

export { listenerCli };
