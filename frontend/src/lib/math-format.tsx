export function formatMath(text: string): string {
  let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  s = s.replace(
    /\[IMG:(https?:\/\/[^\]]+)\]/g,
    (_, url) =>
      `<img class="inline-block align-middle max-h-7 mx-0.5" src="${url}" alt="формула" />`,
  );

  s = s.replace(/vec\(([^)]+)\)/g, (_, l) => {
    const w = Math.max(l.trim().length * 9, 12);
    return `<span class="inline-block text-center italic text-blue-900 align-baseline"><span class="block h-1.5 leading-none text-center -mb-px"><svg width="${w}" height="6" viewBox="0 0 ${w} 6" fill="none" class="block mx-auto"><line x1="0" y1="3" x2="${w - 2}" y2="3" stroke="#1e3a8a" stroke-width="1.2"/><polyline points="${w - 5},1 ${w - 1},3 ${w - 5},5" stroke="#1e3a8a" stroke-width="1.2" fill="none"/></svg></span><span class="block">${l.trim()}</span></span>`;
  });

  s = s.replace(
    /\(([^()]+)\/([^()]+)\)/g,
    (_, n, d) =>
      `<span class="inline-flex flex-col items-center align-middle text-blue-900 mx-0.5 leading-tight"><span class="px-1 pb-0.5 border-b border-blue-900">${n.trim()}</span><span class="px-1 pt-0.5">${d.trim()}</span></span>`,
  );

  s = s.replace(
    /root\(([^,]+),\s*([^)]+)\)/g,
    (_, i, b) =>
      `<span class="inline-flex items-end align-middle text-blue-900 mx-0.5"><span class="text-[0.6em] self-start mr-[-2px] mt-0.5">${i.trim()}</span><span class="text-lg leading-none mr-[-1px]">√</span><span class="border-t-2 border-blue-900 px-1 mt-px">${b.trim()}</span></span>`,
  );

  s = s.replace(
    /sqrt\(([^)]+)\)/g,
    (_, b) =>
      `<span class="inline-flex items-end align-middle text-blue-900 mx-0.5"><span class="text-lg leading-none mr-[-1px]">√</span><span class="border-t-2 border-blue-900 px-1 mt-px">${b.trim()}</span></span>`,
  );

  s = s.replace(
    /\^(\(([^()]*(?:\([^()]*\))*[^()]*)\))/g,
    (_, __, i) => `<sup class="text-xs text-blue-900">${i}</sup>`,
  );

  s = s.replace(/_\(([^)]+)\)/g, `<sub class="text-xs text-blue-900">$1</sub>`);

  return s;
}
