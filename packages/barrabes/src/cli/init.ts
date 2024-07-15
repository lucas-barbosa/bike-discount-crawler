import { Command } from 'commander';
import { getBarrabesCli } from './crawler.cli';

const crawlersCli = new Command();

crawlersCli.name('crawler')
  .description('CLI to handle @crawlers')
  .version('1.0.0');

crawlersCli.addCommand(getBarrabesCli());
crawlersCli.parse();
