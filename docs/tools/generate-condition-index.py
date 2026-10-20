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
   if kind in ['block_end','variable_end']:tags.append((begin,line+value.count('\n'),''.join(buf).strip()));begin=None;buf=[]
 groups={}
 for node in list(tree.find_all(nodes.If))+list(tree.find_all(nodes.CondExpr)):
  tag=next((t for t in tags if t[0]<=node.lineno<=t[1]),None)
  if tag is None:raise ValueError((file.name,node.lineno))
  owner=next((name for line,name in reversed(macros) if line<=node.lineno),'module');key=(tag[0],owner)
  row=groups.setdefault(key,{'file':file.name,'line':tag[0],'macro':owner,'tag':tag[2],'if':0,'inline_if':0});row['if' if isinstance(node,nodes.If) else 'inline_if']+=1
 items.extend(groups[k] for k in sorted(groups))
count=sum(x['if']+x['inline_if'] for x in items)
lines=['# Полный каталог условий контроллера','',f'Сгенерировано из {len(sources)} публичных Jinja-файлов v0.10.0: **{count} условных операторов** в **{len(items)} исходных тегах**.','', 'Каталог включает if/elif и выражения вида value if test else other. Составные and/or остаются в точном исходном выражении. Это инвентаризация кода, не заявление о полном покрытии физических событий.','', '[Обзор и блок-схемы](automation-flow.md). Обновление: python3 docs/tools/generate-condition-index.py.','']
last=''
for row in items:
 if row['file']!=last:lines+=['## '+row['file'],''];last=row['file']
 lines += [f"### {row['macro']} - L{row['line']}",'',f"[Исходник](../controller/{row['file']}#L{row['line']}) | if/elif: {row['if']}, inline-if: {row['inline_if']}",'','```jinja',row['tag'],'```','']
(ROOT/'docs/condition-index.md').write_text('\n'.join(lines),encoding='utf-8')
(ROOT/'docs/diagrams/condition-index.json').write_text(json.dumps({'module_version':'0.10.0','conditional_operators':count,'source_tags':len(items),'sources':sources,'entries':items},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(sources),'conditional_operators':count,'source_tags':len(items)}))
