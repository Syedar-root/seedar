export function printHelp(): void {
  console.log(`Seedar CLI

??:
  seedar install [version]
  seedar start
  seedar stop
  seedar update [version]
  seedar uninstall [--remove-data] [--all] [--force]
  seedar remove --force
  seedar purge --force
  seedar status
  seedar logs [mysql|server|web|migrate] [--follow]
  seedar doctor
`);
}
