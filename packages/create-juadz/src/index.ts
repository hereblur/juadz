import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import chalk from 'chalk';
import validatePackageName from 'validate-npm-package-name';
import { execSync } from 'child_process';
import { generateFromTemplate } from './generators/template-generator';

export interface CreateAppOptions {
  template?: string;
  skipInstall?: boolean;
  git?: boolean;
}

export async function createJuadzApp(projectName: string, options: CreateAppOptions = {}) {
  console.log(chalk.blue('🚀 Creating Juadz application...'));

  // Validate project name
  const validation = validatePackageName(projectName);
  if (!validation.validForNewPackages) {
    console.error(chalk.red('Error: Invalid package name'));
    process.exit(1);
  }

  const projectPath = path.resolve(process.cwd(), projectName);
  console.log(chalk.blue(`📂 Project path: ${projectPath}`));

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${projectName} already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Cancelled.'));
      process.exit(0);
    }

    fs.removeSync(projectPath);
  }

  // Prompt for template if not provided
  let template = options.template;
  if (!template) {
    const { template: selectedTemplate } = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: [
          { name: 'Minimal', value: 'minimal' },
          { name: 'Standard well structured', value: 'standard' },
        ],
        default: 'minimal',
      },
    ]);
    template = selectedTemplate;
  }

  // Create project directory
  fs.ensureDirSync(projectPath);

  console.log(chalk.green(`✅ Created directory ${projectName}`));

  // Generate from template
  await generateFromTemplate(template!, projectPath, {
    projectName,
    ...options,
  });

  if (!options.skipInstall) {
    // Install dependencies
    console.log(chalk.blue('📦 Installing dependencies...'));
    try {
        execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
        console.log(chalk.green('✅ Dependencies installed'));
    } catch (error) {
        console.log(chalk.yellow('⚠️  Failed to install dependencies. Run `npm install` manually.'));
    }
  }

  // Initialize git
  if (options.git) {
    try {
      execSync('git init', { cwd: projectPath, stdio: 'pipe' });
      execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
      execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'pipe' });
      console.log(chalk.green('✅ Git repository initialized'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Failed to initialize git repository'));
    }
  }

  // Success message
  console.log(chalk.green.bold('\n🎉 Successfully created Juadz application!'));
  console.log(chalk.cyan('\nNext steps:'));
  console.log(chalk.white(`  cd ${projectName}`));
  console.log(chalk.white('  npm run dev'));
  console.log(chalk.white('  Open http://localhost:3000'));
}