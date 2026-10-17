import pathlib,json,zipfile,hashlib
root=pathlib.Path(__file__).resolve().parents[1]
pkg=json.loads((root/'package.json').read_text())
out=root/'release';out.mkdir(exist_ok=True)
manifest=json.loads((root/'dist/release-manifest.json').read_text())
assert manifest.get('sources'),'Build source manifest missing'
for name,expected in manifest['sources'].items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest()==expected,'Stale build: '+name
def put(archive,source,name):
    info=zipfile.ZipInfo(name,(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
    archive.writestr(info,source.read_bytes())
payload=out/f"ha-material3-{pkg['version']}.zip"
with zipfile.ZipFile(payload,'w') as archive:
    for item in manifest['files']:put(archive,root/'dist'/item['path'],item['path'])
    put(archive,root/'dist/release-manifest.json','release-manifest.json')
source=out/f"ha-material3-{pkg['version']}-source.zip"
directories=['src','scripts','tests','dev','tokens','assets','examples','docs','themes','dist','.github']
files=['package.json','package-lock.json','README.md','CHANGELOG.md','LICENSE','THIRD_PARTY_NOTICES.md','hacs.json','.gitignore','.gitattributes']
with zipfile.ZipFile(source,'w') as archive:
    for name in files:
        if(root/name).is_file():put(archive,root/name,name)
    for name in directories:
        if not(root/name).exists():continue
        for file in sorted((root/name).rglob('*')):
            if file.is_file() and '__pycache__' not in file.parts:put(archive,file,file.relative_to(root).as_posix())
for archive in [payload,source]:print(json.dumps({'path':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}))
