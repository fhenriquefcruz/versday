import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL(
  '../.github/workflows/deploy-vercel-api.yml',
  import.meta.url
);

test('workflow Vercel mantém guardas de deploy e ativação automática', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*\n\s+contents: write/);
  assert.match(workflow, /uses: actions\/checkout@v4\s*\n\s+with:\s*\n\s+ref: main/);
  assert.match(workflow, /vercel@59\.19\.1/);
  assert.match(workflow, /sync_env "UNSPLASH_ACCESS_KEY" "\$UNSPLASH_ACCESS_KEY"/);
  assert.match(workflow, /sync_env "GROQ_API_KEY" "\$GROQ_API_KEY"/);
  assert.match(workflow, /scripts\/configure-backend\.mjs/);
  assert.match(workflow, /git push origin HEAD:main/);
  assert.match(workflow, /steps\.health\.outputs\.images/);
  assert.match(workflow, /steps\.health\.outputs\.chat/);

  assert.doesNotMatch(workflow, /echo\s+"\$UNSPLASH_ACCESS_KEY"/);
  assert.doesNotMatch(workflow, /echo\s+"\$GROQ_API_KEY"/);
});

test('workflow extrai flags do health com quoting shell seguro', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.match(
    workflow,
    /IMAGES_CONFIGURED="\$\(node -p 'JSON\.parse\(require\("fs"\)\.readFileSync\("health\.json","utf8"\)\)\.providers\?\.imagesConfigured === true'\)"/
  );
  assert.match(
    workflow,
    /CHAT_CONFIGURED="\$\(node -p 'JSON\.parse\(require\("fs"\)\.readFileSync\("health\.json","utf8"\)\)\.providers\?\.chatConfigured === true'\)"/
  );
});
