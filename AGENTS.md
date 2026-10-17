<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The `home_mid` banner placement renders after the home services section on mobile and desktop so admins control that scrolling section from Posting (Banners).
- Public worker discovery uses the filtered `workers_public` projection, with matching public-profile RLS and periodic refresh alongside realtime so hidden-row events cannot leave stale listings; raw worker reads retain owner/staff authorization.
