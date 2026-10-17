# HA Material 3 Kit - design proposal

Макеты и архитектурная основа подключаемого интерфейса Home Assistant. Тёмная тема основная; светлая строится из тех же цветовых ролей. Статус на 2026-10-17: интерактивный дизайн-прототип, не готовый HACS-релиз. В работающий HA ничего из этой директории не установлено.

Два самостоятельных профиля:

- **M3 Baseline**: классические компоненты, сдержанные поверхности, outlined segmented buttons.
- **M3 Expressive**: акцентная температурная область, emphasized typography и connected button group. Размеры, цвета и состояния задаются токенами; профиль не смешивается с Baseline случайными исключениями.

Состав:

| Путь | Назначение |
| --- | --- |
| `design/mockup.html` | Редактируемый шаблон двух макетов |
| `design/src/demo-config.json` | Обезличенные демонстрационные данные |
| `design/src/generate-tokens.js` | Генератор цветовых ролей Google Material Color Utilities |
| `tokens/material3-palettes.json` | Три seed-палитры, light/dark, spec 2025 |
| `tokens/foundation.json` | Типографика, shape tokens и базовые метрики |
| `docs/architecture.md` | Варианты упаковки и рекомендуемое разделение модулей |
| `docs/material3-audit.md` | Проверяемые требования и открытые отличия от спецификации |
| `examples/proposed-dashboard.yaml` | Предлагаемый контракт настройки, не установленный компонент |

Сборка демонстрации:

```sh
cd design
npm ci
npm run build
node src/audit.mjs
```

Результат: `design/dist/material3-mockups.html` - фрагмент для предпросмотра, не JavaScript-ресурс HA. Генератор фиксирован lockfile; `@material/web` 2.5.0, `@material/material-color-utilities` 0.4.0. Пакеты официальных компонентов нужны для референсного прототипа. Выбор production runtime описан отдельно.

Публичная сборка содержит нейтральное место для камеры. Кадры, конфигурация квартиры, токены, адрес HA и настоящие entity_id в проект не включаются. Не публиковать `design/preview.html`, `design/checks/` или `node_modules/`; они исключены в `.gitignore`. Опция `--private-camera-source` предназначена только для локального сравнения с пользовательским референсом: результат сохранять за пределами этого проекта.

Шрифты в прототипе загружаются с Google Fonts. В распространяемом модуле шрифты, Material Symbols и лицензии должны быть включены локально, без обязательного доступа к CDN. До публикации выбрать лицензию собственного кода; сохранить Apache-2.0 notices зависимостей и лицензии конкретных файлов шрифтов. Проект не является официальным продуктом Google или Home Assistant.

Официальные источники: [Material 3](https://m3.material.io/), [Material Web](https://github.com/material-components/material-web), [Material Web theming](https://material-web.dev/theming/color/), [HA custom cards](https://contributors.home-assistant.io/frontend/custom-ui/card/), [HA custom view](https://contributors.home-assistant.io/frontend/custom-ui/view/), [HA custom panel](https://www.home-assistant.io/integrations/panel_custom/).
