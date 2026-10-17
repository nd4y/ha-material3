# Аудит Material 3: макеты

Дата: 2026-10-17. Область: дизайн-прототип. Процент полного соответствия не присвоен. Material 3 задаёт систему компонентов и правил, а не единственный эталонный скриншот приложения. Проверять следует конкретный профиль и его состояния.

## Зафиксированный референс

- [Material 3](https://m3.material.io/), включая Expressive.
- [Color roles](https://m3.material.io/styles/color/roles).
- [Typography tokens](https://m3.material.io/styles/typography/type-scale-tokens).
- [Button group specs](https://m3.material.io/components/button-groups/specs).
- Официальный npm `@material/web@2.5.0`, token snapshot `tokens/versions/latest/sass`, Google Material 3 **34.0.21**, platform web, font static.
- Цвета: `@material/material-color-utilities@0.4.0`, `SchemeTonalSpot`, явно выбран spec `2025`, contrast level 0. Три исходных цвета, две яркости. Сырые hex-значения не подбираются отдельно для каждой карточки.

## Трассировка компонентов

| Элемент | Основа и размеры | Текущее состояние |
| --- | --- | --- |
| Цвета | `--md-sys-color-*`, парные on-colors, Surface Container roles | Генерируются; контраст ключевых пар проверен |
| Типографика | Roboto; 15 ролей, size/line-height/tracking/weight | 60 значений foundation совпадают с upstream |
| Скругления | Именованные corner tokens, включая 4/8/12/16/20/28/32/48/full | 10 значений foundation совпадают с upstream |
| Baseline buttons/switch/dialog/slider | Официальные Material Web components | Работают в изолированном предпросмотре |
| Segmented buttons Baseline | Outlined, container 40, effective hit area 48, selected Secondary Container | Собственная составная реализация с официальным ripple |
| Connected group Expressive | Small: container 40, gap 2, inner 8, selected 50%, pressed inner 4 | Сверено с upstream tokens, собственная реализация |
| Navigation rail | Width 80, indicator 56 x 32; active icon On Secondary Container, label On Surface | Воспроизведено; мобильный вариант заменяет rail на navigation bar |
| Filled cards Baseline | Corner Medium 12, Surface Container Highest | Воспроизведено |
| Композиция Expressive | Контейнеры Corner Extra Large 28, температурная область Corner Large Increased 20 | Составные компоненты приложения, не утверждение, что у стандартной M3 filled card радиус 28 |
| Состояния | Official ripple/focus у импортированных компонентов; локальные selected/pressed/disabled | Базовое поведение есть, полный visual state audit впереди |
| Motion | Локальная shape transition 200 ms, standard easing; reduced-motion отключает её | Physics-based Expressive motion пока не реализован и не сертифицирован |

Не путать новые token files с готовыми Expressive web components: наличие токенов в пакете не означает наличие реализации. На официальной странице Button groups Web implementation отмечен unavailable. У репозитория Material Web указан maintenance mode.

## Выполненные проверки

`design/audit-results.json` генерируется командой `node src/audit.mjs` после сборки.

- 60 сравнений параметров типографики и 10 сравнений shape tokens: без расхождений. Это проверка foundation, а не доказательство, что каждый CSS-селектор во всех состояниях уже верен.
- 60 цветовых проверок для трёх палитр light/dark: без ошибок. Минимум для проверенных текстовых пар **4.939:1**, порог 4.5:1; Outline/Surface проверялся отдельно с порогом 3:1. Фото, произвольные будущие seed colors и все наложения state layers в эти цифры не входят.
- Оба script blocks публичного фрагмента проходят JS parsing. Финальный публичный фрагмент 189740 bytes, приватный preview 874526 bytes; оба меньше 1 MB.
- В публичном варианте отсутствуют приватный raster camera frame, внутренний hostname и поля секретов по проверенным шаблонам. Это узкая статическая проверка, не замена review всего релиза перед публикацией.
- Edge: тёмный Baseline и Expressive на viewport 1024; одинаковая высота stage 900 CSS px, горизонтального overflow нет.
- Узкие viewport 320 и 390: регулятор и карточки помещаются, при нехватке места цель переносится на следующую строку. Меню режимов полностью раскрывается поверх следующей карточки. Внутренний preview iframe сам имеет поля, поэтому доступная приложению ширина меньше viewport; проверка выполнялась по фактической ширине приложения.
- Кнопки +/- меняют локальную цель; preset не изменяет её. Максимум показывает 15-минутный отсчёт и отменяется в повседневный. Климат-контроль переключается. Бризер открывает диалог, slider управляется стрелками клавиатуры. Меню управляется стрелками/Enter/Escape. Навигация в комнаты и диалог камеры работают.
- В console последней сборки ошибок не обнаружено. Снимки проверок хранятся только в игнорируемой локальной `design/checks/` и не предназначены для GitHub.
- Исправлены найденные проблемы: замена bundle с `$` ломала template substitution (теперь callback replacement); лишние иконки compact button; обрезание дробной цели на 320; clipping меню родительской карточкой; неверная pressed-геометрия connected group; selected label color rail. Служебная SVG data URI библиотеки первоначально дала ложный сигнал camera scan, проверка сужена до raster base64 images.

## Критерии приёмки production-модуля

1. Выбран профиль M3 и зафиксированы версия токенов, компонентная матрица и допустимые составные компоненты приложения.
2. Каждый компонент имеет сверку default/hover/focus/pressed/selected/disabled/loading/error/unavailable, где применимо. Проверяется эффективная зона нажатия минимум 48 x 48, без перекрытия соседних действий.
3. Воспроизводимые screenshot tests на компактной, средней и большой ширине, в dark/light, разных масштабах, с длинными русскими строками и увеличенным системным текстом. Допуски устанавливаются для геометрии, а не процентом похожести всего скриншота с разным сглаживанием шрифтов.
4. Контраст текста/иконок/состояний, клавиатура, focus order/return, screen reader names, reduced motion. Нужен полный accessibility audit, не только проверка цветовых пар.
5. Expressive: проверены motion, state morphing и все размеры компонентов; до этого нельзя заявлять точное воспроизведение physics-based motion.
6. Подтверждена работа через реальные `hass` state/action updates и capability attributes, без перерисовки камеры на каждом обновлении. Сопоставление сценариев и таймер берутся с backend HA.
7. В чистом тестовом HA проверены установка/обновление/удаление ресурса, coexistence с другими custom cards, отсутствие конфликта `customElements`, visual editor и Companion WebViews.
8. Все ассеты локальны, лицензии включены, generic config отделён от личного, CI повторяет build/audit и release checks.

Не проверено в этом этапе: live HA runtime/установка HACS, физические устройства, полный 15-минутный цикл, все браузеры и Companion apps, визуальный light-mode audit, все focus/hover/pressed combinations, screen reader, обновление/откат production-модуля. Это следующий этап после выбора макета и архитектуры. Работающий Home Assistant не изменялся.
