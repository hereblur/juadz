#!/usr/bin/env node

const { program } = require('commander');
const { createJuadzApp } = require('../build/index.js');

program
  .name('create-juadz')
  .description('Create a new Juadz application')
  .argument('<project-name>', 'name of the project')
  .option('-t, --template <template>', 'template to use', 'minimal')
  .option('-s, --skip-install', 'skip install packages', false)
  .option('--git', 'initialize git repository', true)
  .action(async (projectName, options) => {
    try {
      await createJuadzApp(projectName, options);
    } catch (error) {
      console.error('Error creating Juadz app:', error.message);
      process.exit(1);
    }
  });

program.parse();