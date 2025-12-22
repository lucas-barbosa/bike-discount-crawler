import { Command } from 'commander';
import { listenerCli } from './listener.cli';
import { crawlersCli } from './crawler.cli';
import { schedulerCli } from './scheduler.cli';
import { categorySchedulerCli } from './category-scheduler.cli';

const program = new Command();

program.addCommand(listenerCli);
program.addCommand(crawlersCli);
program.addCommand(schedulerCli);
program.addCommand(categorySchedulerCli);

program.parse();
