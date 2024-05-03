import { Command } from 'commander';
import { listenerCli } from './listener.cli';
import { crawlersCli } from './crawler.cli';

const program = new Command();

program.addCommand(listenerCli);
program.addCommand(crawlersCli);

program.parse();
