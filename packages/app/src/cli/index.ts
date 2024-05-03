import { Command } from 'commander';
import { listenerCli } from './listener.cli';

const program = new Command();

program.addCommand(listenerCli);

program.parse();
