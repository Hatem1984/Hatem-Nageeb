# n8n Automation Source of Truth

This folder is the version-controlled source for selected n8n workflows.

## Safety model

- Production workflows are not auto-deployed.
- GitHub Actions deployment is manual only (`workflow_dispatch`).
- No API keys, passwords, bearer tokens, or OAuth secrets belong in the repository.
- Sensitive values stay in GitHub Secrets or n8n Credentials.
- Staging workflows must be tested before production workflow IDs are targeted.

## Current workflow

### LinkedIn Image Generator V3 - Cloudflare Free - STAGING

Path:
`automation/n8n/workflows/linkedin-image-generator-v3-cloudflare-staging.json`

Purpose:
1. Read the first pending LinkedIn image job from the staging Google Sheet.
2. Generate a bright editorial 4:5 image with Cloudflare Workers AI.
3. Upload the image to Google Drive.
4. Write the Drive URL and image status back to the staging Sheet.

Identity:
- LinkedIn brand: Hatem Naguib / حاتم نجيب personal brand.
- Do not use "لعبة البزنس" branding in LinkedIn creatives.
- Visual direction: bright, airy, professional editorial consulting photography.
- Arabic headline text is added later from the design template; the image model should not render text.

## Required n8n configuration

### Credential
Create a secure HTTP Header Auth credential for Cloudflare:
- Header name: `Authorization`
- Header value: `Bearer <CLOUDFLARE_API_TOKEN>`

Do not place the token in workflow JSON.

### Non-secret variable
- `CLOUDFLARE_ACCOUNT_ID`

## GitHub → n8n deployment

GitHub Action:
`.github/workflows/deploy-n8n-workflow.yml`

Required repository secret:
- `N8N_API_KEY`

n8n base URL is currently:
`https://vmi3001071.contaboserver.net`

The Action can:
- Create a workflow when `workflow_id` is blank.
- Update an existing workflow when `workflow_id` is supplied.

## Rollout

1. Deploy image generator to STAGING.
2. Run a dry test against one staging row.
3. Verify image quality, Drive upload, Sheet status, and no accidental LinkedIn publication.
4. Connect the approved-image path to LinkedIn Content Factory V2.
5. Only after successful end-to-end tests, update production.


## Current n8n workflow IDs

- LinkedIn Image Generator V3 - Cloudflare Free - STAGING: `jwG2V2csZqHzAOTk`

Future updates to this workflow should target this ID instead of creating a new workflow.
