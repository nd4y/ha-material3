# Updating and removing

Before changes, save the module release and dashboard/panel YAML, resource registration and selected theme. Do not publish an HA token or private camera image in an issue/repository.

For Lovelace, remove the module's dashboard/cards and its one JS resource. For panel_custom, remove only its entry and restart HA to apply registration changes. Remove its own www/community asset directory after it is no longer referenced. Keep backend helpers, scripts, automation, integrations and other dashboards.

To roll back, restore the previous complete dist directory and matching configuration, restore the resource/cache URL and refresh clients. Assets must match the JS version.

The development installation has a protected host checkpoint and a guarded rollback script outside this public project. It refuses to remove a dashboard or asset that changed subsequently. Private checkpoints/configuration must not be published.
