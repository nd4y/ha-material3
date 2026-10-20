import hashlib,importlib.util,json,pathlib,tempfile,unittest,os
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('link_controller',ROOT/'scripts/link-controller.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class ControllerLinks(unittest.TestCase):
    def test_verified_policy_link_tracks_hacs_updates_without_overwriting_configuration(self):
        with tempfile.TemporaryDirectory() as raw:
            config=pathlib.Path(raw);module=config/'www/community/ha-material3';module.mkdir(parents=True)
            policy=module/'ha-m3-demo.jinja';policy.write_text('old',encoding='utf-8')
            manifest={'version':'test','files':[{'path':policy.name,'sha256':hashlib.sha256(b'old').hexdigest()}]}
            (module/'release-manifest.json').write_text(json.dumps(manifest))
            try:mod.link_controller(config)
            except OSError as error:
                # Windows may deny symlinks without Developer Mode; prove that
                # failure preserves source files. POSIX CI and HA test real links.
                if os.name!='nt' or getattr(error,'winerror',None)!=1314:raise
                self.assertEqual(policy.read_bytes(),b'old')
                self.assertFalse((config/'custom_templates/ha-material3'/policy.name).exists())
                return
            link=config/'custom_templates/ha-material3'/policy.name
            self.assertTrue(link.is_symlink());self.assertEqual(link.read_text(),'old')
            policy.write_text('new',encoding='utf-8');self.assertEqual(link.read_text(),'new')
            self.assertEqual([p.name for p in (config/'custom_templates').rglob('*.jinja')],[policy.name])
    def test_modified_templates_bad_hashes_and_external_paths_are_preserved(self):
        with tempfile.TemporaryDirectory() as raw:
            config=pathlib.Path(raw);module=config/'www/community/ha-material3';module.mkdir(parents=True)
            policy=module/'ha-m3-demo.jinja';policy.write_bytes(b'policy')
            manifest={'version':'test','files':[{'path':policy.name,'sha256':hashlib.sha256(b'policy').hexdigest()}]}
            (module/'release-manifest.json').write_text(json.dumps(manifest))
            dest=config/'custom_templates/ha-material3';dest.mkdir(parents=True);(dest/policy.name).write_text('private')
            with self.assertRaises(ValueError):mod.link_controller(config)
            self.assertEqual((dest/policy.name).read_text(),'private')
            with self.assertRaises(ValueError):mod.link_controller(config,config.parent)
            policy.write_bytes(b'corrupt')
            with self.assertRaises(ValueError):mod.link_controller(config)
