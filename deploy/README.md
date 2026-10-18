# Chromium PDF sandbox

`chromium-seccomp.json` berasal dari profil Playwright v1.64.0 (Apache-2.0): https://github.com/microsoft/playwright/blob/v1.64.0/utils/docker/seccomp_profile.json.

Profil mempertahankan default-deny Docker dan mengizinkan namespace untuk sandbox Chromium. Perubahan lokal: syscall `chroot` diizinkan tanpa filter capability Docker agar Chromium dapat melakukan chroot **di dalam user namespace-nya** saat container memakai `cap_drop: ALL`; kernel tetap menolak chroot tanpa kewenangan namespace yang sesuai. Tidak memakai privileged, SYS_ADMIN, IPC host, atau seccomp unconfined.

Renderer memakai sandbox secara default. `CHROMIUM_SANDBOX=off` hanya dipakai step CI untuk fixture HTML tepercaya pada runner disposable; jangan diterapkan pada worker deployment. Uji nyata pada LXC Docker dengan node non-root, no-new-privileges dan cap-drop ALL telah berhasil. Rujukan konfigurasi: https://playwright.dev/docs/docker.
