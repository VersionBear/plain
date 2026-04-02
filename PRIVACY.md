# Plain Privacy

Plain is a local-first notes app. The app does not require an account and does
not send your notes to a Plain server because there is no backend for note
storage or sync in this repository.

## What stays local

- Your notes stay on your device.
- If you do not connect a folder, notes are stored in browser-managed local
  storage on that device.
- If you connect a folder, notes are written as Markdown files in that folder.
- Exported files are generated locally in your browser.

## What leaves the device

- License verification sends your Gumroad license key to Gumroad when you
  redeem or re-check a license.
- The app may open documentation, support, or purchase links when you choose
  those actions.

## What Plain does not do

- No account signup
- No built-in sync
- No analytics or tracking code in this repository
- No remote note backup service

## Your responsibility

If you need recovery beyond a single browser/device, connect a folder or export
regular backups. Browser-only storage is not a cross-device backup.
