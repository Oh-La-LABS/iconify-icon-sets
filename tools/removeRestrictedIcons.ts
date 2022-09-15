/**
 * This file is part of the iconify-icon-sets repo from Oh-La LABS.
 *
 * (c) Markus Liljergren <markus@oh-lalabs.com>
 *
 * @license MIT
 *
 * For the full copyright and license information, please view the license.txt
 * file that is available in this file's directory.
 */
import { promises as fs } from 'fs';
import type { IconifyInfo, IconifyJSON } from '@iconify/types';

export type IconifyMetaDataCollection = {
  [prefix: string]: IconifyInfo;
};

(async () => {
  const collections = JSON.parse(
      await fs.readFile('collections-original.json', 'utf8')
  ) as IconifyMetaDataCollection;

  let numAllowedIcons = 0;
  let numAllowedSets = 0;
  let numNotAllowedIcons = 0;
  let numNotAllowedSets = 0;
  let ollCollection = {} as IconifyMetaDataCollection;
  let ollCollectionMd = '# List of icon collections used on CORE\n\n'
  for (let iconSet in collections) {
    let title = collections[iconSet].license.title
    switch (title) {
      // These are suitable and some require attribution
      case 'Apache 2.0':
      case 'CC0 1.0':
      case 'CC0':
      case 'CC BY 4.0':
      case 'CC BY SA':
      case 'CC BY-SA 4.0':
      case 'CC BY SA 4.0':
      case 'ISC':
      case 'MIT':
      case 'Open Font License':
      case 'Unlicense':
        let s = collections[iconSet];
        ollCollection[iconSet] = s;
        if (s.hidden !== true) {
          numAllowedSets += 1;
          numAllowedIcons += collections[iconSet].total as any;
          ollCollectionMd += `### ${s.name}\n`;
          ollCollectionMd += `* Number of icons: ${s.total}\n`
          ollCollectionMd += `* Author: ${s.author.name}\n`
          ollCollectionMd += `* URL: ${s.author.url}\n`
          ollCollectionMd += `* License: ${s.license.title}\n`
          ollCollectionMd += `* License URL: ${s.license.url}\n`
          if (s.version) ollCollectionMd += `* Version: ${s.version}\n`
          ollCollectionMd += s.palette ? `* Palette: Colorful\n` : '* Palette: Colorless\n'
          ollCollectionMd += '\n\n';
        } else {
          console.log('Hidden:', title, '-', iconSet, collections[iconSet].license.url);
        }
        break;
      // The following may NOT be suitable to accept in this repo:
      case 'CC BY-NC 4.0':
      case 'GPL':
      case 'GPL 2.0':
      case 'GPL 3.0':
      default:
        numNotAllowedSets += 1;
        numNotAllowedIcons += collections[iconSet].total as any;
        console.log('Removed:', title, '-', iconSet, collections[iconSet].license.url);
        try {
          await fs.unlink(`json/${iconSet}.json`);
        } catch (e: unknown) {
          if (!(e instanceof Error && e.message.includes('ENOENT'))) {
            console.log('Failed to delete:', `json/${iconSet}.json`, 'reason:', e)
          }
        }
    }
  };
  ollCollectionMd += '## Summary\n';
  ollCollectionMd += `* Number of sets: ${numAllowedSets}\n`;
  ollCollectionMd += `* Number of icons: ${numAllowedIcons}\n`;
  console.log('Total Icons allowed:', numAllowedIcons);
  console.log('Total Icons NOT allowed:', numNotAllowedIcons);
  console.log('Total Sets allowed:', numAllowedSets);
  console.log('Total Sets NOT allowed:', numNotAllowedSets);
  await fs.writeFile('collections.json', JSON.stringify(ollCollection, null, 2))
  await fs.writeFile('collections.md', ollCollectionMd)
})()
