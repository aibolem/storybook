/* eslint-disable local-rules/no-uncategorized-errors */

/* eslint-disable no-underscore-dangle */
import { getStoryTitle } from '@storybook/core/common';
import type { StoriesEntry } from '@storybook/core/types';

import * as t from '@babel/types';
import { dedent } from 'ts-dedent';

import { formatCsf, loadCsf } from '../CsfFile';

const logger = console;

export async function vitestTransform({
  code,
  fileName,
  configDir,
  stories,
  tagsFilter,
}: {
  code: string;
  fileName: string;
  configDir: string;
  tagsFilter: {
    include: string[];
    exclude: string[];
  };
  stories: StoriesEntry[];
}) {
  const isStoryFile = /\.stor(y|ies)\./.test(fileName);
  if (!isStoryFile) {
    return code;
  }

  const parsed = loadCsf(code, {
    fileName,
    transformInlineMeta: true,
    makeTitle: (title) => {
      const result =
        title ||
        getStoryTitle({
          storyFilePath: fileName,
          configDir,
          stories,
        }) ||
        'unknown';

      if (result === 'unknown') {
        logger.warn(
          dedent`
            [Storybook]: Could not calculate story title for "${fileName}".
            Please make sure that this file matches the globs included in the "stories" array in your Storybook configuration at "${configDir}".
          `
        );
      }
      return result;
    },
  }).parse();

  const ast = parsed._ast;

  const metaExportName = parsed._metaVariableName!;

  const metaNode = parsed._metaNode as t.ObjectExpression;

  const hasTitleProperty = metaNode.properties.some(
    (prop) => t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'title'
  );

  if (!hasTitleProperty) {
    const title = parsed._meta?.title || 'unknown';
    metaNode.properties.push(t.objectProperty(t.identifier('title'), t.stringLiteral(title)));
  }

  if (!metaNode || !parsed._meta) {
    throw new Error(
      'The Storybook vitest plugin could not detect the meta (default export) object in the story file. \n\nPlease make sure you have a default export with the meta object. If you are using a different export format that is not supported, please file an issue with details about your use case.'
    );
  }

  const vitestTestId = parsed._file.path.scope.generateUidIdentifier('test');
  const composeStoryId = parsed._file.path.scope.generateUidIdentifier('composeStory');
  const testStoryId = parsed._file.path.scope.generateUidIdentifier('testStory');
  const isValidTestId = parsed._file.path.scope.generateUidIdentifier('isValidTest');

  const tagsFilterId = t.identifier(JSON.stringify(tagsFilter));

  const getTestStatementForStory = ({ exportName, node }: { exportName: string; node: t.Node }) => {
    const composedStoryId = parsed._file.path.scope.generateUidIdentifier(`composed${exportName}`);

    const composeStoryCall = t.variableDeclaration('const', [
      t.variableDeclarator(
        composedStoryId,
        t.callExpression(composeStoryId, [t.identifier(exportName), t.identifier(metaExportName)])
      ),
    ]);
    // Preserve sourcemaps location
    composeStoryCall.loc = node.loc;

    const isValidTestCall = t.ifStatement(
      t.callExpression(isValidTestId, [
        composedStoryId,
        t.identifier(metaExportName),
        tagsFilterId,
      ]),
      t.blockStatement([
        t.expressionStatement(
          t.callExpression(vitestTestId, [
            t.stringLiteral(exportName),
            t.callExpression(testStoryId, [composedStoryId, tagsFilterId]),
          ])
        ),
      ])
    );
    // Preserve sourcemaps location
    isValidTestCall.loc = node.loc;

    return [composeStoryCall, isValidTestCall];
  };

  Object.entries(parsed._storyStatements).forEach(([exportName, node]) => {
    ast.program.body.push(
      ...getTestStatementForStory({
        exportName,
        node,
      })
    );
  });

  const imports = [
    t.importDeclaration(
      [t.importSpecifier(vitestTestId, t.identifier('test'))],
      t.stringLiteral('vitest')
    ),
    t.importDeclaration(
      [t.importSpecifier(composeStoryId, t.identifier('composeStory'))],
      t.stringLiteral('storybook/internal/preview-api')
    ),
    t.importDeclaration(
      [
        t.importSpecifier(testStoryId, t.identifier('testStory')),
        t.importSpecifier(isValidTestId, t.identifier('isValidTest')),
      ],
      t.stringLiteral('@storybook/experimental-addon-vitest/internal/test-utils')
    ),
  ];

  ast.program.body.unshift(...imports);

  return formatCsf(parsed, { sourceMaps: true, sourceFileName: fileName }, code);
}
