# CampaignURLBuilder

## Microsoft Teams app

The Teams personal app displays the GitHub Pages site at
https://dpo-ama.github.io/CampaignURLBuilder/. The site must be deployed before
installing the app; the Teams package contains only a manifest and icons.
Publish the updated `index.html` and the pages in `teams/` to GitHub Pages before
uploading the app package. The app's privacy and terms URLs point to those pages.

To build the upload package in PowerShell:

```powershell
.\teams\build-package.ps1
```

In Teams, choose **Apps → Manage your apps → Upload an app → Upload a custom app**
and select `teams/campaign-url-builder-teams.zip`. Choose **Add** to install it.
Your organization must allow custom app uploads. To distribute the app to the
whole organization, submit the same package for admin approval or ask a Teams
admin to upload it.

After changing the manifest, increase its `version` before uploading an update.
Changes to `index.html` are delivered through the GitHub Pages deployment.
