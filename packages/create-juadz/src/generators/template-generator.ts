import path from 'path';
import fs from 'fs-extra';
import Mustache from 'mustache';
import chalk from 'chalk';

interface TemplateContext {
  projectName: string;
  typescript?: boolean;
  [key: string]: any;
}

export async function generateFromTemplate(
  templateName: string,
  outputPath: string,
  context: TemplateContext
) {
  const templatePath = path.join(__dirname, '../../templates', templateName);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template "${templateName}" not found`);
  }

  console.log(chalk.blue(`📄 Generating from template: ${templateName}`));

  await copyTemplate(templatePath, outputPath, context);
}

async function copyTemplate(templatePath: string, outputPath: string, context: TemplateContext) {
  const files = fs.readdirSync(templatePath, { withFileTypes: true });

  for (const file of files) {
    const srcPath = path.join(templatePath, file.name);
    const destPath = path.join(outputPath, file.name);

    if (file.isDirectory()) {
      fs.ensureDirSync(destPath);
      await copyTemplate(srcPath, destPath, context);
    } else {
      // Process template files
      if (file.name.endsWith('.mustache')) {
        const templateContent = fs.readFileSync(srcPath, 'utf-8');
        const rendered = Mustache.render(templateContent, context);
        const outputFileName = file.name.replace('.mustache', '');
        fs.writeFileSync(path.join(outputPath, outputFileName), rendered);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}