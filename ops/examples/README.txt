UBT Library — run examples (ops/examples)
============================================

These .txt files describe how to run the app and which files under
project/ you need. They do NOT change anything in project/.

Read in this order:
  1. project-server-files-needed.txt
  2. project-client-files-needed.txt
  3. run-api-local.txt
  4. run-web-local.txt
  5. run-full-stack-local.txt
  6. aws-pipeline-paths.txt

Docker on AWS (optional — copy into project/server yourself if you want):
  - project-server-Dockerfile.example.txt  →  project/server/Dockerfile
  - project-server-dockerignore.example.txt → project/server/.dockerignore

CI/CD deploy copies those examples automatically during CodeBuild
(see ops/cicd/api/buildspec-deploy.yml). Your git copy of project/ stays unchanged.
