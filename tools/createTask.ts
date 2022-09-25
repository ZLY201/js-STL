import gulp from 'gulp';
import ts from 'gulp-typescript';
import fs from 'fs';
import path from 'path';
import { SrcOptions } from 'vinyl-fs';
import { gulpIsolateFactory } from './buildFactory';
import PackageJson from '../package.json';

function createIsolateTask(
  taskPrefix: string,
  input: {
    indexFile: string,
    globs: string | string[],
    opts?: SrcOptions
  },
  overrideSettings: Omit<ts.Settings, 'outDir'>,
  useCjsTransform = false,
  task: {
    name: string,
    sourceRoots: string | string[],
    output: string
  }
) {
  return gulpIsolateFactory(
    taskPrefix,
    {
      sourceRoots: task.sourceRoots,
      ...input
    },
    task.output,
    overrideSettings,
    useCjsTransform
  );
}

function createSharedFilesCopyTask(
  config: IsolateBuildConfig,
  packageSettings: IsolateBuildConfig['builds'][number],
  outputPattern: `${string}{name}${string}`
) {
  function copySharedFiles() {
    return gulp.src(config.sharedFiles)
      .pipe(gulp.dest(outputPattern.replace('{name}', packageSettings.name)));
  }
  copySharedFiles.displayName = 'copy-shared-files';
  return copySharedFiles;
}

function createPackageJsonCreateTask(
  packageSettings: IsolateBuildConfig['builds'][number],
  outputPattern: `${string}{name}${string}`
) {
  async function createPackageJson() {
    const packageJson = {
      ...PackageJson,
      name: `@${PackageJson.name}/${packageSettings.name}`,
      version: packageSettings.version
    };
    const noNeedFields = ['scripts', 'files'];
    noNeedFields.forEach(field => Reflect.deleteProperty(packageJson, field));
    const packageJsonPath = path.join(
      outputPattern.replace('{name}', packageSettings.name),
      'package.json'
    );
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  createPackageJson.displayName = 'create-package-json';
  return createPackageJson;
}

export type IsolateBuildConfig = {
  builds: {
    name: string;
    version: string;
    sourceRoots: string | string[];
  }[],
  sharedFiles: string | string[]
};

export function createIsolateTasksFromConfig(config: IsolateBuildConfig) {
  const tasks: string[] = [];

  for (const build of config.builds) {
    const isolateCjsBuildTask = createIsolateTask(
      'cjs',
      {
        indexFile: 'src/index.ts',
        globs: 'src/**/*.ts',
        opts: { base: 'src' }
      },
      {
        module: 'ES2015',
        declaration: true
      },
      true,
      {
        ...build,
        output: `dist/isolate/${build.name}/dist/cjs`
      }
    );

    const isolateEsmBuildTask = createIsolateTask(
      'esm',
      {
        indexFile: 'src/index.ts',
        globs: 'src/**/*.ts',
        opts: { base: 'src' }
      },
      {
        target: 'ES5',
        module: 'ES2015',
        declaration: true
      },
      false,
      {
        ...build,
        output: `dist/isolate/${build.name}/dist/esm`
      }
    );

    const copySharedFilesTask = createSharedFilesCopyTask(
      config,
      build,
      'dist/isolate/{name}'
    );

    const createPackageJsonTask = createPackageJsonCreateTask(
      build,
      'dist/isolate/{name}'
    );

    gulp.task(
      `isolate:${build.name}`,
      gulp.series(
        isolateCjsBuildTask,
        isolateEsmBuildTask,
        copySharedFilesTask,
        createPackageJsonTask
      )
    );
    tasks.push(`isolate:${build.name}`);
  }

  return tasks;
}
