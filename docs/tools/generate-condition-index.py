"""Generate the exact Jinja conditional-tag inventory; no HA/network access."""
from pathlib import Path
import hashlib,json
from jinja2 import Environment,nodes
ROOT=Path(__file__).resolve().parents[2]
env=Environment();items=[];sources={}
for file in sorted((ROOT/'controller').glob('*.jinja')):
 source=file.read_text(encoding='utf-8');tree=env.parse(source);sources[file.name]=hashlib.sha256(source.encode()).hexdigest();macros=sorted((x.lineno,x.name) for x in tree.find_all(nodes.Macro));tags=[];buf=[];begin=None
 for line,kind,value in env.lex(source):
  if kind in ['block_begin','variable_begin']:buf=[value];begin=line
  elif begin is not None:
   buf.append(value)
   if kind in ['block_end','variable_end']:tags.append((begin,line+value.rstrip().count('\n'),''.join(buf).strip()));begin=None;buf=[]
 groups={}
 for node in [x for x in tree.find_all(nodes.Node) if isinstance(x,(nodes.If,nodes.CondExpr,nodes.And,nodes.Or,nodes.Not,nodes.Compare,nodes.Test)) or isinstance(x,nodes.Call) and isinstance(x.node,nodes.Name) and x.node.name=='is_number']:
  matches=[t for t in tags if t[0]<=node.lineno<=t[1]]
  tag=(min(t[0] for t in matches),max(t[1] for t in matches),' '.join(t[2] for t in matches)) if matches else None
  if tag is None:raise ValueError((file.name,node.lineno))
  owner=next((name for line,name in reversed(macros) if line<=node.lineno),'module');key=(tag[0],owner)
  row=groups.setdefault(key,{'file':file.name,'line':tag[0],'macro':owner,'tag':tag[2],'if':0,'inline_if':0,'predicates':0});row['if' if isinstance(node,nodes.If) else 'inline_if' if isinstance(node,nodes.CondExpr) else 'predicates']+=1
 items.extend(groups[k] for k in sorted(groups))
count=sum(x['if']+x['inline_if'] for x in items);predicates=sum(x['predicates'] for x in items)
lines=['# Каталог условий Jinja-шаблонов','', 'Область: только переносимые Jinja-формулы. Python-планировщик и исполнение описаны в [блок-схемах](automation-flow.md) и [архитектуре](controller-architecture.md). Этот каталог не является полным перечнем условий reconcile-контроллера.','',f'Сгенерировано из {len(sources)} публичных Jinja-файлов (точные SHA-256 в JSON рядом): **{count} условных операторов** и **{predicates} логических / сравнительных выражений** в **{len(items)} исходных тегах**.','', 'Каталог включает if/elif, value if test else other, and/or/not, сравнения, Jinja-тесты и is_number, в том числе внутри присваиваний и возвращаемых флагов. Вложенные узлы посчитаны отдельно; это не число независимых сценариев. Теги приводятся целиком; соседние теги на одной строке объединены, поскольку Jinja AST хранит номер строки без позиции столбца. Это инвентаризация кода, не заявление о полном покрытии физических событий.','', '[Обзор и блок-схемы](automation-flow.md). Обновление: python3 docs/tools/generate-condition-index.py.','']
last=''
for row in items:
 if row['file']!=last:lines+=['## '+row['file'],''];last=row['file']
 lines += [f"### {row['macro']} - L{row['line']}",'',f"[Исходник](../controller/{row['file']}#L{row['line']}) | if/elif: {row['if']}, inline-if: {row['inline_if']}, предикаты: {row['predicates']}",'','```jinja',row['tag'],'```','']
(ROOT/'docs/condition-index.md').write_text('\n'.join(lines),encoding='utf-8')
(ROOT/'docs/diagrams/condition-index.json').write_text(json.dumps({'scope':'public_jinja_templates_only','conditional_operators':count,'predicate_expressions':predicates,'source_tags':len(items),'sources':sources,'entries':items},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(sources),'conditional_operators':count,'predicate_expressions':predicates,'source_tags':len(items)}))
