"""Link verified HACS policy files into HA's custom-template loader once."""
import argparse,hashlib,json,os,pathlib

def link_controller(config_dir,module_dir=None):
    config=pathlib.Path(config_dir).resolve()
    module=pathlib.Path(module_dir or config/'www/community/ha-material3').resolve()
    if not module.is_relative_to(config):raise ValueError('Module must stay inside the HA config directory')
    manifest=json.loads((module/'release-manifest.json').read_text(encoding='utf-8'))
    policies=[p for p in manifest['files'] if p['path'].startswith('ha-m3-') and p['path'].endswith('.jinja')]
    if not policies:raise ValueError('This release has no controller policies')
    destination=config/'custom_templates/ha-material3'
    if destination.is_symlink():raise ValueError('Template namespace must be a real directory')
    destination.mkdir(parents=True,exist_ok=True)
    verified=[]
    for item in policies:
        name=item['path']
        if pathlib.PurePath(name).name!=name:raise ValueError('Flat policy filename required')
        target=module/name;link=destination/name
        data=target.read_bytes()
        if hashlib.sha256(data).hexdigest()!=item['sha256']:raise ValueError('Policy checksum mismatch: '+name)
        if link.is_symlink():
            if link.resolve()!=target:raise ValueError('Existing link has a different owner: '+name)
        elif link.exists():
            if not link.is_file() or link.read_bytes()!=data:raise ValueError('Preserve locally modified template: '+name)
            link.unlink()
        if not link.is_symlink():link.symlink_to(os.path.relpath(target,link.parent))
        verified.append(name)
    return {'version':manifest['version'],'linked':verified}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',required=True)
    parser.add_argument('--module-dir')
    args=parser.parse_args()
    print(json.dumps(link_controller(args.config,args.module_dir)))
