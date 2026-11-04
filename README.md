# CampaignURLBuilder

## Website files

- `index.html` contains the form markup.
- `css/styles.css` contains the site's custom styles.
- `js/app.js` loads the campaign configuration and connects the form controls.
- `js/url-builder.js` builds campaign names and tracking URLs.
- `data/campaign-config.json` contains the editable option labels, values, and rules.

The site needs no build step. To run it locally, start a web server from the
repository root and open <http://localhost:8000/>:

```powershell
python -m http.server 8000
```

To check URL generation after changing the code or configuration, run `npm test`.
The tests use Node.js built-in tools and require no installed packages.

Open the site through the server because the browser cannot load the JSON file
with `fetch()` from a `file://` page. In the JSON, `label` controls what users
see, IDs select rules, and values become parts of generated names or URLs. Keep
referenced medium, source, platform, and campaign type codes in sync when
editing options.

## Microsoft Teams app

The Teams personal app displays the GitHub Pages site at
https://dpo-ama.github.io/CampaignURLBuilder/. The site must be deployed before
installing the app; the Teams package contains only a manifest and icons.
Publish the website files and the pages in `teams/` to GitHub Pages before
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
Changes to the website files are delivered through the GitHub Pages deployment.

To limit who can use the Teams app, an admin can set its availability to specific
users or groups in **Teams admin center → Teams apps → Manage apps → Campaign
URL Builder → Users and groups → Edit availability**. This only controls the
Teams app. The GitHub Pages URL remains publicly accessible.
