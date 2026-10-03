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
  assert.match(workflow, /steps\.health\.outputs\.vlm/);
  assert.match(workflow, /enable_vlm:/);
  assert.match(workflow, /default:\s*false/);
  assert.match(
    workflow,
    /sync_env "GROQ_MODEL" "qwen\/qwen3\.8-27b"/
  );
  assert.match(
    workflow,
    /sync_env "GROQ_VISION_MODEL" "qwen\/qwen3\.8-27b"/
  );
  assert.match(
    workflow,
    /sync_env "VISUAL_VLM_ENABLED" "\$VISUAL_VLM_ENABLED"/
  );
  assert.doesNotMatch(workflow, /llama-3\.3-70b-versatile/);

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
  assert.match(
    workflow,
    /VLM_CONFIGURED="\$\(node -p 'JSON\.parse\(require\("fs"\)\.readFileSync\("health\.json","utf8"\)\)\.providers\?\.vlmConfigured === true'\)"/
  );
});

test('workflow nunca usa RTM como destino padrão do VersDay', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.doesNotMatch(workflow, /default:\s*rtm11/i);
  assert.match(
    workflow,
    /Vercel account\/team slug dedicated to VersDay/
  );
  assert.match(
    workflow,
    /RTM is a separate project\. Use a Vercel account\/team dedicated to VersDay\./
  );
  assert.match(
    workflow,
    /\[ "\$NORMALIZED_SCOPE" = "rtm11" \]/
  );
});

test('workflow exige scope VersDay explicitamente antes do deploy', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  const validateIndex = workflow.indexOf('Validate VersDay Vercel scope');
  const deployIndex = workflow.indexOf('Deploy production backend');

  assert.ok(validateIndex >= 0);
  assert.ok(deployIndex > validateIndex);
  assert.match(workflow, /if \[ -z "\$VERCEL_SCOPE" \]/);
});