"""Stage raw HACS assets plus manual archives and checksums for GitHub Release."""
import pathlib,json,hashlib,shutil
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'dist/release-manifest.json').read_text())
out=root/'release';out.mkdir(exist_ok=True)
names=[f"ha-material3-{manifest['version']}.zip",f"ha-material3-{manifest['version']}-source.zip"]
for name in names:assert(out/name).is_file(),'Run scripts/package.py first'
for item in manifest['files']:
    name=item['path'];assert pathlib.PurePosixPath(name).name==name and '/'not in name and '\\'not in name
    data=(root/'dist'/name).read_bytes();assert hashlib.sha256(data).hexdigest()==item['sha256']
    shutil.copyfile(root/'dist'/name,out/name);names.append(name)
shutil.copyfile(root/'dist/release-manifest.json',out/'release-manifest.json');names.append('release-manifest.json')
checksums=''.join(hashlib.sha256((out/name).read_bytes()).hexdigest()+'  '+name+'\n'for name in sorted(names))
(out/'SHA256SUMS').write_text(checksums,encoding='utf-8',newline='\n')
print(json.dumps({'hacs_files':len(manifest['files'])+1,'release_files':len(names)+1,'version':manifest['version']}))
