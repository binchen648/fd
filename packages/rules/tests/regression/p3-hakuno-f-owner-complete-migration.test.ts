import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,expect,it} from 'vitest';
import * as rules from '../../src/index';

const archivePath=resolve('data/authoring/masters/master.hakuno-f.json');
const frozenIds=[
  'master.hakuno-f.skill.ascension',
  'master.hakuno-f.skill.s1',
  'master.hakuno-f.skill.s2',
  'master.hakuno-f.skill.s3',
  'master.hakuno-f.skill.s4',
  'master.hakuno-f.skill.s5',
] as const;

function loadArchive(){
  return rules.loadAuthoringJson(JSON.parse(readFileSync(archivePath,'utf8')) as any);
}

describe('Hakuno-F owner-complete canonical migration',()=>{
  it('loads exactly the six frozen skills with one four-Code roster',()=>{
    const loaded=loadArchive();
    expect(loaded.report).toEqual([]);
    expect(loaded.cards['master.hakuno-f.skill.ascension']).toBeDefined();
    expect(Object.keys(loaded.cards).sort()).toEqual([...frozenIds].sort());
    expect(loaded.cards['master.hakuno-f.skill.ascension']!.abilities[0]!.effects[0]).toEqual({
      type:'mystic_code_regalia',
      codeDefinitionIds:{
        extra:'master.hakuno-f.skill.s5',
        ccc:'master.hakuno-f.skill.s3',
        extella:'master.hakuno-f.skill.s4',
        link:'master.hakuno-f.skill.s2',
      },
    });
    for(const id of frozenIds.slice(2)){
      expect((loaded.cards[id] as any).initialPlacement).toBe('outside_game');
    }
  });

  it('keeps the locked printed texts and six distinct skill identities',()=>{
    const raw=JSON.parse(readFileSync(archivePath,'utf8')) as {cards:Array<{id:string;printedText:string}>};
    const texts=Object.fromEntries(raw.cards.map(card=>[card.id,card.printedText]));
    expect(texts['master.hakuno-f.skill.ascension']).toContain('【Extra】获得');
    expect(texts['master.hakuno-f.skill.s1']).toContain('选择游戏外的一张【神秘代码】');
    expect(texts['master.hakuno-f.skill.s2']).toContain('代码_月球驱动');
    expect(texts['master.hakuno-f.skill.s3']).toContain('代码_非法侵入');
    expect(texts['master.hakuno-f.skill.s4']).toContain('cc_回复()');
    expect(texts['master.hakuno-f.skill.s5']).toContain('代码_秘密通道');
    expect(new Set(Object.keys(texts)).size).toBe(6);
  });
});
