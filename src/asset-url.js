export function assetUrl(name,moduleUrl,version){
  const url=new URL(`./${name}`,moduleUrl);
  url.searchParams.set('v',version);
  return url.href;
}
