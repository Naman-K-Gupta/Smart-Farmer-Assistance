---
name: Preview restart disconnects
description: Preview browser sockets can briefly disconnect while a managed Vite workflow restarts.
---

Treat a transient Vite “server connection lost” or `ERR_SOCKET_NOT_CONNECTED` message during a workflow restart as a preview transport event first, not an application crash. Confirm by checking the workflow logs, API status, and a fresh screenshot after the restart.

**Why:** Restarting the web workflow while the preview is open closes the existing HMR socket before the replacement server is ready.

**How to apply:** When this appears alongside a healthy workflow and no stack trace, wait for the workflow to be ready and refresh the preview before changing application code.