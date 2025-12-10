The legacy `routes/` folder was removed from the repository. Implementations now live in `src/routes/` and `src/routes/handlers/`.

Backups of the original JS files were saved in `backup_js_before_cleanup/` prior to removal.

If any runtime errors reference `routes/`, restore files from the backup folder or revert this commit.